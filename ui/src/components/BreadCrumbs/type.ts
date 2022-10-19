import { relatedListType } from "@/services/alarm";

export interface logLibraryInfoType {
  relatedList: relatedListType[];
  instanceName: string;
  instanceDesc?: string;
  databaseName: string;
  databaseDesc?: string;
  tableName: string;
  tableDesc?: string;
  tid?: number;
  did?: number;
}
