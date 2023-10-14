// 集思录数据行结构
export interface JisiluRecord {
  bond_id: string; // 代码
  bond_nm: string; // 转债名称
  price: number; // 现价
  stock_nm: string; // 正股名称
  sprice: number; // 正股价
  stock_id: string; // 正股代码
  pb: number; // 正股 PB
  convert_value: number; // 转股价值
  premium_rt: number; // 转股溢价率
  dblow: number; // 双低值
  // TODO: 会员字段 - 纯债价值
  rating_cd: string; // 债券评级
  convert_amt_ratio: number; // 转债占流通市值
  // TODO: 会员字段 - 基金持仓
  year_left: number; // 剩余年限
  curr_iss_amt: number; // 剩余规模
  ytm_rt: number; // 持有到期税前收益
  maturity_dt: string; // 到期时间
  btype: 'C' | 'E'; // C 可转债 E 可交换债
}

// 多维表格行结构
export interface BitableRecord {
  '代码': string;
  '转债名称': string;
  '现价': number;
  '正股名称': string;
  '正股价': number;
  '正股PB': number;
  '转股价值': number;
  '转股溢价率': number;
  '双低': number;
  '债券评级': string;
  '转债占流通市值': number;
  '剩余年限': number;
  '剩余规模': number;
  '到期税前收益': number;
  '到期时间': number; // timestamp
  '债券类型': string;
}
