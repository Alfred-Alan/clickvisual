package pusher

import (
	"bytes"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/gotomicro/ego/core/econf"

	"github.com/clickvisual/clickvisual/api/internal/invoker"
	"github.com/clickvisual/clickvisual/api/pkg/model/db"
)

type IPusher interface {
	Send(*db.AlarmChannel, *db.PushMsg) error
}

func GetPusher(typ int) (IPusher, error) {
	var err error
	switch typ {
	case db.ChannelDingDing:
		return &DingDing{}, nil
	case db.ChannelWeChat:
		return &WeChat{}, nil
	case db.ChannelFeiShu:
		return &FeiShu{}, nil
	case db.ChannelSlack:
		return &Slack{}, nil
	case db.ChannelEmail:
		return &Email{}, nil
	case db.ChannelTelegram:
		return &Telegram{}, nil
	default:
		err = errors.New("undefined channels")
	}
	return nil, err
}

// BuildAlarmMsg
// Description: 提供一个通用的md模式的获取内容的方法
// param notification  通知的部分方法
// param alarm 警告的数据库连接
// param oneTheLogs 日志内容
func BuildAlarmMsg(notification db.Notification, table *db.BaseTable, alarm *db.Alarm, filter *db.AlarmFilter, partialLog string) (msg *db.PushMsg, err error) {
	// groupKey := notification.GroupKey
	annotations := notification.CommonAnnotations
	var buffer bytes.Buffer
	// base info
	if notification.GetStatus() == db.AlarmStatusNormal {
		buffer.WriteString("###  <font color=#008000>您的告警已恢复</font>\n")
	} else {
		buffer.WriteString("###  <font color=#FF0000>您有待处理的告警</font>\n")
	}
	buffer.WriteString(fmt.Sprintf("##### 告警名称: %s\n", alarm.Name))
	if alarm.Desc != "" {
		buffer.WriteString(fmt.Sprintf("##### 告警描述: %s\n", alarm.Desc))
	}
	users, phones := dutyOffices(alarm)
	instance, _ := db.InstanceInfo(invoker.Db, table.Database.Iid)
	statusText := "告警中"
	for _, alert := range notification.Alerts {
		end := alert.StartsAt.Add(time.Minute).Unix()
		start := alert.StartsAt.Add(-alarm.GetInterval() - time.Minute).Unix()
		annotations = alert.Annotations
		buffer.WriteString(fmt.Sprintf("##### 触发时间: %s\n", alert.StartsAt.Add(time.Hour*8).Format("2006-01-02 15:04:05")))
		buffer.WriteString(fmt.Sprintf("##### 相关实例: %s %s\n", instance.Name, instance.Desc))
		buffer.WriteString(fmt.Sprintf("##### 日志库: %s %s\n", table.Name, table.Desc))
		if notification.GetStatus() == db.AlarmStatusNormal {
			statusText = "已恢复"
			buffer.WriteString("##### 状态: <font color=#008000>已恢复</font>\n")
		} else {
			buffer.WriteString("##### 状态: <font color=red>告警中</font>\n")
		}
		dutyOfficesStr := ""
		for _, user := range users {
			if dutyOfficesStr == "" {
				dutyOfficesStr = fmt.Sprintf("@%s", user.Phone)
			} else {
				dutyOfficesStr = fmt.Sprintf("%s@%s", dutyOfficesStr, user.Phone)
			}
		}
		if dutyOfficesStr == "" {
			user, _ := db.UserInfo(alarm.Uid)
			buffer.WriteString(fmt.Sprintf("##### 创建人: %s \n", user.Nickname))
		} else {
			buffer.WriteString(fmt.Sprintf("##### 责任人: %s \n", dutyOfficesStr))
		}

		buffer.WriteString(fmt.Sprintf("##### %s\n\n", annotations["description"]))
		buffer.WriteString(fmt.Sprintf("##### clickvisual 跳转: %s/share?mode=0&tab=custom&tid=%d&kw=%s&start=%d&end=%d\n\n",
			strings.TrimRight(econf.GetString("app.rootURL"), "/"), filter.Tid, url.QueryEscape(filter.When), start, end,
		))
		if partialLog != "" {
			partialLog = strings.Replace(partialLog, "\"", "", -1)
			if len(partialLog) > 600 {
				buffer.WriteString(fmt.Sprintf("##### 日志: %s ...", partialLog[0:599]))
			} else {
				buffer.WriteString(fmt.Sprintf("##### 日志: %s", partialLog))
			}
		}
	}
	pushMsg := &db.PushMsg{
		Title: fmt.Sprintf("【%s】%s", statusText, alarm.Name),
		Text:  buffer.String(),
	}
	if len(phones) != 0 {
		pushMsg.Mobiles = phones
	}
	return pushMsg, nil
}

func Execute(channelIds []int, pushMsg *db.PushMsg) error {
	for _, channelId := range channelIds {
		channel, err := db.AlarmChannelInfo(invoker.Db, channelId)
		if err != nil {
			return err
		}
		channelPusher, err := GetPusher(channel.Typ)
		if err != nil {
			return err
		}
		err = channelPusher.Send(&channel, pushMsg)
		if err != nil {
			return err
		}
	}
	return nil
}

func dutyOffices(alarm *db.Alarm) ([]db.User, []string) {
	dutyOfficers := make([]db.User, 0)
	phones := make([]string, 0)
	for _, dutyOfficer := range alarm.DutyOfficers {
		user, _ := db.UserInfo(dutyOfficer)
		if user.Phone != "" {
			dutyOfficers = append(dutyOfficers, user)
			phones = append(phones, user.Phone)
		}
	}
	return dutyOfficers, phones
}
