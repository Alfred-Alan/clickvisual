import rawLogTabsStyles from "@/pages/DataLogs/components/RawLogTabs/index.less";
import { Button, Empty, Tabs } from "antd";
import QueryResult from "@/pages/DataLogs/components/QueryResult";
import { useModel } from "@@/plugin-model/useModel";
import lodash from "lodash";
import { useIntl } from "umi";
import useTimeOptions from "@/pages/DataLogs/hooks/useTimeOptions";
import useUrlState from "@ahooksjs/use-url-state";
import { RestUrlStates } from "@/pages/DataLogs/hooks/useLogUrlParams";
import useLocalStorages, { LocalModuleType } from "@/hooks/useLocalStorages";
import { useEffect } from "react";
import { FullscreenOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;

const RawLogTabs = () => {
  const [_, setUrlState] = useUrlState();
  const {
    currentLogLibrary,
    onChangeLogPane,
    onChangeLogLibrary,
    resetLogs,
    resizeMenuWidth,
    logPanesHelper,
    onChangeCurrentLogPane,
    onChangeFoldingState,
  } = useModel("dataLogs");
  const { onChangeSelectKeys } = useModel("instances");
  const { logPanes, paneKeys, removeLogPane } = logPanesHelper;
  const { onSetLocalData } = useLocalStorages();

  const i18n = useIntl();
  const { handleChangeRelativeAmountAndUnit } = useTimeOptions();

  const onEdit = (currentKey: any, action: any) => {
    if (!currentKey || action !== "remove") return;
    const currentPanes = lodash.cloneDeep(logPanes);
    const resultKeys = paneKeys.filter((key) => key !== currentKey) || [];
    const len = resultKeys.length;
    removeLogPane(currentKey);
    if (len === 0) {
      resetLogs();
      setUrlState(RestUrlStates);
      onChangeLogLibrary(undefined);
    }
    if (len > 0 && parseInt(currentKey) === currentLogLibrary?.id) {
      const currentPane = currentPanes[resultKeys[0]];
      delete currentPanes[currentKey];
      handleChangeRelativeAmountAndUnit(currentPane);
      onChangeCurrentLogPane(currentPane, currentPanes);
      onChangeLogLibrary({
        id: parseInt(currentPane.paneId),
        tableName: currentPane.pane,
        createType: currentPane.paneType,
        desc: currentPane.desc,
        relTraceTableId: currentPane.relTraceTableId,
      });
    }
  };

  const handleChangeTab = (key: string) => {
    onChangeSelectKeys([`table-${key}`]);
    const logLibraryId = parseInt(key);
    if (logLibraryId === currentLogLibrary?.id) return;
    const tabPane = logPanes[key];
    if (!tabPane) return;
    handleChangeRelativeAmountAndUnit(tabPane);
    onChangeLogPane(tabPane);
  };

  // 全屏/取消全屏 事件
  const handleFullScreen = () => {
    //全屏
    var docElm: any = document.documentElement;
    const isFull = isFullscreenForNoScroll();
    onChangeFoldingState(!isFull);
    if (isFull) {
      //W3C
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      //W3C
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      }
    }
  };

  // 判断浏览器是否全屏
  const isFullscreenForNoScroll: () => boolean = () => {
    var explorer = window.navigator.userAgent.toLowerCase();
    if (explorer.indexOf("chrome") > 0) {
      //webkit
      return (
        document.body.scrollHeight === window.screen.height &&
        document.body.scrollWidth === window.screen.width
      );
    } else {
      //IE 9+  fireFox
      return (
        window.outerHeight === window.screen.height &&
        window.outerWidth === window.screen.width
      );
    }
  };

  // 窗口关闭或刷新清除所有的datalogsQuerySql缓存值
  useEffect(() => {
    const listener = () => {
      onSetLocalData(null, LocalModuleType.datalogsQuerySql);
    };
    window.addEventListener("beforeunload", listener);
    return () => {
      window.removeEventListener("beforeunload", listener);
    };
  }, []);

  // TODO: Tabs性能待优化
  return (
    <div className={rawLogTabsStyles.rawLogTabsMain}>
      {paneKeys.length > 0 ? (
        <Tabs
          hideAdd
          type="editable-card"
          activeKey={currentLogLibrary?.id.toString()}
          onChange={handleChangeTab}
          className={rawLogTabsStyles.tabs}
          onEdit={onEdit}
          destroyInactiveTabPane
          animated={false}
          style={{ width: `calc(100vw - ${83 + resizeMenuWidth}px)` }}
          tabBarExtraContent={
            <Button
              type="link"
              icon={<FullscreenOutlined />}
              onClick={handleFullScreen}
            />
          }
        >
          {paneKeys.map((item) => {
            const pane = logPanes[item];
            return (
              pane && (
                <TabPane key={pane.paneId} tab={pane.pane} forceRender>
                  {pane.paneId === currentLogLibrary?.id.toString() ? (
                    <QueryResult tid={pane.paneId} />
                  ) : null}
                </TabPane>
              )
            );
          })}
        </Tabs>
      ) : (
        <Empty
          style={{ flex: 1 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={i18n.formatMessage({ id: "log.empty.logLibrary" })}
        />
      )}
    </div>
  );
};
export default RawLogTabs;
