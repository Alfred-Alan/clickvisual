import nodeStyles from "@/pages/DataAnalysis/RealTimeBusinessFlow/components/BusinessChart/styles/nodeContent.less";
import { BusinessChartResponse } from "@/services/realTimeTrafficFlow";
import { Statistic, Tooltip, notification, Button, message } from "antd";
import { useIntl, useModel } from "umi";
import { byteConvert } from "@/utils/byteConvertUtil";
import classNames from "classnames";
import { useMemo } from "react";
import useUrlState from "@ahooksjs/use-url-state";
import copy from "copy-to-clipboard";
import { useDebounceFn } from "ahooks";
import { DEBOUNCE_WAIT } from "@/config/config";

interface NodeContentProps {
  node: BusinessChartResponse;
}

const NodeContent = ({ node }: NodeContentProps) => {
  const i18n = useIntl();
  const { realTimeTraffic } = useModel("dataAnalysis");
  const { doTableCreatSql } = realTimeTraffic;
  const [urlState] = useUrlState();

  const language = useMemo(
    () => localStorage.getItem("umi_locale"),
    [localStorage.getItem("umi_locale")]
  );

  const tranNumber = (num: number, point: number) => {
    // 将数字转换为字符串,然后通过split方法用.分隔,取到第0个
    let numStr = num.toString().split(".")[0];
    if (numStr.length < 6) {
      // 判断数字有多长,如果小于6,,表示10万以内的数字,让其直接显示
      return numStr;
    } else if (numStr.length >= 6 && numStr.length <= 8) {
      // 如果数字大于6位,小于8位,让其数字后面加单位万
      let decimal = numStr.substring(
        numStr.length - 4,
        numStr.length - 4 + point
      );
      // 由千位,百位组成的一个数字
      return parseFloat(Math.floor(num / 10000) + "." + decimal) + "万";
    } else {
      // 如果数字大于8位,让其数字后面加单位亿
      let decimal = numStr.substring(
        numStr.length - 8,
        numStr.length - 8 + point
      );
      return parseFloat(Math.floor(num / 100000000) + "." + decimal) + "亿";
    }
  };

  const handleBigNumbers = (num: number) => {
    if (language === "zh-CN") {
      return tranNumber(num, 2);
    } else {
      return (
        <Statistic
          valueStyle={{ fontSize: "12px", display: "inline-block" }}
          value={num}
        />
      );
    }
  };

  const handleBuildTableSQL = useDebounceFn(
    (dName: string, tName: string) => {
      urlState?.iid &&
        dName &&
        tName &&
        doTableCreatSql
          .run(parseInt(urlState.iid), dName, tName)
          .then((res: any) => {
            if (res.code != 0) return;
            notification.open({
              duration: null,
              message: i18n.formatMessage({
                id: "bigdata.realtime.buildTableSQL",
              }),
              description: (
                <>
                  <pre style={{ maxHeight: "80vh" }}>{res.data}</pre>
                  <Button
                    type="primary"
                    style={{ float: "right" }}
                    onClick={() => {
                      try {
                        copy(res.data);
                        message.success(
                          i18n.formatMessage({
                            id: "log.item.copy.success",
                          })
                        );
                      } catch (error) {
                        message.error(
                          i18n.formatMessage({ id: "log.item.copy.failed" })
                        );
                      }
                    }}
                  >
                    {i18n.formatMessage({ id: "log.item.copy" })}
                  </Button>
                </>
              ),
              placement: "top",
              style: { width: "1000px" },
            });
          });
    },
    { wait: DEBOUNCE_WAIT }
  ).run;

  return (
    <div
      className={classNames(nodeStyles.nodeContentMain)}
      onClick={() => handleBuildTableSQL(node.database, node.table)}
    >
      <div className={nodeStyles.tableAndDatabase}>
        <span>
          {i18n.formatMessage({
            id: "bigdata.realtime.table",
          })}
          :&nbsp;
        </span>
        <Tooltip title={node.table} placement={"left"}>
          <div className={classNames(nodeStyles.context, nodeStyles.textAlign)}>
            <span>{node.table}</span>
          </div>
        </Tooltip>
      </div>
      <div className={nodeStyles.tableAndDatabase}>
        <span>
          {i18n.formatMessage({
            id: "bigdata.realtime.database",
          })}
          :&nbsp;
        </span>
        <Tooltip title={node.database} placement={"left"}>
          <div className={classNames(nodeStyles.context, nodeStyles.textAlign)}>
            <span>{node.database}</span>
          </div>
        </Tooltip>
      </div>
      <div className={nodeStyles.textAlign}>
        <span>{i18n.formatMessage({ id: "type" })}:&nbsp;</span>
        {node.engine}
      </div>
      <div className={nodeStyles.capacity}>
        <div>
          <span>{i18n.formatMessage({ id: "capacity" })}:&nbsp;</span>
          <span>{byteConvert(node.totalBytes)}</span>
        </div>
        <Tooltip title={node.totalRows} placement={"right"}>
          <div>
            <span>{i18n.formatMessage({ id: "count" })}:&nbsp;</span>
            <span style={{ display: "inline-block" }}>
              {handleBigNumbers(node.totalRows)}
            </span>
          </div>
        </Tooltip>
      </div>
      <></>
    </div>
  );
};

export default NodeContent;
