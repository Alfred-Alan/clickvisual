import { useState } from "react";
import useRequest from "@/hooks/useRequest/useRequest";
import realTimeBusinessApi, {
  BusinessChartResponse,
} from "@/services/realTimeTrafficFlow";
import { useEdgesState, useNodesState } from "react-flow-renderer";

const useRealTimeTraffic = () => {
  const [databases, setDatabases] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [businessChart, setBusinessChart] = useState<BusinessChartResponse[]>(
    []
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const doGetBusinessChart = useRequest(realTimeBusinessApi.getBusinessChart, {
    loadingText: false,
  });

  const doTableCreatSql = useRequest(realTimeBusinessApi.creatSql, {
    loadingText: false,
  });

  return {
    databases,
    tables,
    businessChart,
    nodes,
    edges,

    setBusinessChart,
    setDatabases,
    setTables,
    setNodes,
    setEdges,

    onNodesChange,
    onEdgesChange,

    doGetBusinessChart,
    doTableCreatSql,
  };
};
export default useRealTimeTraffic;
