// 集思录数据行结构
export interface JisiluRecord {
  bond_id: string;
  bond_nm: string;
  price: number;
  premium_rt: number;
  dblow: number;
}

// 多维表格行结构
export interface BitableRecord {
  '代码': string;
  '转债名称': string;
  '现价': number;
  '转股溢价率': number;
  '双低': number;
}
