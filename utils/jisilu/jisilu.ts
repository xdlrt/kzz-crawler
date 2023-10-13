import { APIRequestContext } from '@playwright/test';
import { BitableRecord, JisiluRecord } from './type';

export type NewBitableRecords = Array<{
  fields: BitableRecord;
}>;

export type BitableRecords = Array<{
  fields: BitableRecord;
  record_id: string;
}>;

export async function fetchTenantAccessToken(request: APIRequestContext) {
  const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
  const response = await request.post(url, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    data: {
      "app_id": process.env.app_id,
      "app_secret": process.env.app_secret
    }
  });
  const json = await response.json();
  return json;
}

interface ICommonParams {
  token: string;
  app_token: string;
  table_id: string;
}

export interface IBatchCreateParams extends ICommonParams {
  records: NewBitableRecords;
}

export async function batchCreate(request: APIRequestContext, params: IBatchCreateParams) {
  const { token, app_token, table_id, records } = params;
  if (!records || records.length === 0) return { msg: 'no records need to create.' };
  const response = await request.post(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records/batch_create`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      data: {
        records,
      },
    });
  const json = await response.json();
  return json;
}

export async function batchUpdate(request: APIRequestContext, params: IBatchCreateParams) {
  const { token, app_token, table_id, records } = params;
  if (!records || records.length === 0) return { msg: 'no records need to update.' };
  const response = await request.post(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records/batch_update`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      data: {
        records,
      },
    });
  const json = await response.json();
  return json;
}

export interface IBatchDeleteParams extends ICommonParams {
  records: string[];
}

export async function batchDelete(request: APIRequestContext, params: IBatchDeleteParams) {
  const { token, app_token, table_id, records } = params;
  if (!records || records.length === 0) return { msg: 'no records need to update.' };
  const response = await request.post(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records/batch_delete`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      data: {
        records,
      },
    });
  const json = await response.json();
  return json;
}

export interface IBatchQueryParams extends ICommonParams {
  pageSize?: number; // 上限 500
  pageToken?: string; // 分页 token
}

export async function batchQuery(request: APIRequestContext, params: IBatchQueryParams) {
  const { token, app_token, table_id, pageSize = 500, pageToken } = params;
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records?page_size=${pageSize}`;
  const response = await request.get(
    pageToken ? `${url}&page_token=${pageToken}` : url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const json = await response.json();
  return json;
}

// originRecords 表中原有数据
// targetRecords 新爬取的数据
export function makeRecords(originRecords: BitableRecords, targetRecords: NewBitableRecords) {
  const createRecords: NewBitableRecords = [];
  const updateRecords: BitableRecords = [];
  const deleteRecords: BitableRecords = [];

  const originRecordsMap = new Map();
  originRecords.forEach(origin => {
    const code = origin.fields['代码'];
    originRecordsMap.set(code, origin);
  });

  targetRecords.forEach(target => {
    const targetCode = target.fields['代码'];
    const originRecord = originRecordsMap.get(targetCode);
    if (originRecord) {
      updateRecords.push({ ...target, record_id: originRecord.record_id });
      originRecordsMap.delete(targetCode);
    } else {
      createRecords.push(target);
    }
  });

  deleteRecords.push(...originRecordsMap.values());

  return { createRecords, updateRecords, deleteRecords };
}

export async function execute(request: APIRequestContext, params: Omit<IBatchCreateParams, 'token'>) {
  const { tenant_access_token } = await fetchTenantAccessToken(request);

  const commonOptions = {
    token: tenant_access_token,
    app_token: params.app_token,
    table_id: params.table_id,
  };

  const targetRecords = params.records;
  const { data: { items: originRecords, has_more: hasMore, page_token: pageToken } } = await batchQuery(request, commonOptions);
  const aggregatedOriginRecords = [...(originRecords || [])];

  if (hasMore) {
    const { data: { items: newOriginRecords } } = await batchQuery(request, { ...commonOptions, pageToken });
    aggregatedOriginRecords.push(...(newOriginRecords || []));
  }

  const { createRecords, updateRecords, deleteRecords } = makeRecords(aggregatedOriginRecords, targetRecords);

  console.log('----------- createRecords -----------', createRecords.length);
  // console.table(createRecords.map(it => it.fields));
  console.log('----------- updateRecords -----------', updateRecords.length);
  // console.table(updateRecords.map(it => it.fields));
  console.log('----------- deleteRecords -----------', deleteRecords.length);
  // console.table(deleteRecords.map(it => it.fields));

  const createOptions = {
    ...commonOptions,
    records: createRecords,
  };

  const updateOptions = {
    ...commonOptions,
    records: updateRecords,
  };

  const deleteOptions = {
    ...commonOptions,
    records: deleteRecords.map(record => record.record_id!),
  };

  const requests: Array<Promise<any>> = [];

  if (createOptions.records.length > 0) {
    console.log('----------- make create request -----------');
    requests.push(batchCreate(request, createOptions));
  }

  if (updateOptions.records.length > 0) {
    console.log('----------- make update request -----------');
    requests.push(batchUpdate(request, updateOptions));
  }

  if (deleteOptions.records.length > 0) {
    console.log('----------- make delete request -----------');
    requests.push(batchDelete(request, deleteOptions));
  }

  const results = await Promise.all(requests);
  results.forEach(res => {
    console.log('----------- response -----------', res.msg);
  });
}

const getBondType = (btype: JisiluRecord['btype']) => {
  if (btype === 'E') return '可交换债';
  return '可转债';
};

export const makeFields = (record: JisiluRecord) => {
  return {
    '代码': record.bond_id,
    '转债名称': record.bond_nm,
    '现价': record.price,
    '转股溢价率': record.premium_rt / 100,
    '双低': record.dblow,
    '债券类型': getBondType(record.btype),
    '剩余年限': record.year_left,
    '到期时间': +new Date(`${record.maturity_dt}`),
  };
};
