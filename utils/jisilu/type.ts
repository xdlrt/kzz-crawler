// 集思录数据行结构
export interface JisiluRecord {
  bond_id: string; // 代码
  bond_nm: string; // 转债名称
  price: number; // 现价
  premium_rt: number; // 转股溢价率
  dblow: number; // 双低值
  btype: 'C' | 'E'; // C 可转债 E 可交换债
  year_left: number; // 剩余年限
  short_maturity_dt: string; // 到期时间
}

// 多维表格行结构
export interface BitableRecord {
  '代码': string;
  '转债名称': string;
  '现价': number;
  '转股溢价率': number;
  '双低': number;
  '债券类型': string;
  '剩余年限': number;
  '到期时间': number; // timestamp
}
