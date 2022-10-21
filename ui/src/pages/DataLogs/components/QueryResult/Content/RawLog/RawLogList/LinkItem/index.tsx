import styles from "./index.less";
import CalibrationRight from "./CalibrationRight";
import LinkTree from "./LinkTree";
import { microsecondTimeStamp } from "@/utils/time";
import LinkLogInfo from "./LinkLogInfo";

interface LinkItemProps {
  log: any;
}

const LinkItem = (props: LinkItemProps) => {
  const { log } = props;

  const handleGetTotalLength = (list: any[], arr: any[]) => {
    list.map((item: any) => {
      const duration = item?.data?.rawLogJson?.duration
        ? item?.data?.rawLogJson?.duration.slice(0, -1) * Math.pow(10, 6)
        : 0;
      arr.push({
        et: duration + microsecondTimeStamp(item?.data?.rawLogJson?.startTime),
        st: microsecondTimeStamp(item?.data?.rawLogJson?.startTime),
      });
      if (item.children.length > 0) {
        handleGetTotalLength(item.children, arr);
      }
    });
    return arr;
  };

  return (
    <div className={styles.linkItem}>
      <LinkLogInfo log={log} />
      <div className={styles.calibration}>
        <div className={styles.calibrationLeft}>{"Service & Operation"}</div>
        <CalibrationRight log={log} />
      </div>
      <div className={styles.linkContent}>
        <div className={styles.linkTree}>
          <LinkTree log={log} />
        </div>
      </div>
    </div>
  );
};
export default LinkItem;
