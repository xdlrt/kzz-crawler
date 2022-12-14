import { APIRequestContext } from '@playwright/test';
import { BitableRecord, JisiluRecord } from './type';

export type BitableRecords = Array<{
  fields: BitableRecord;
  record_id?: string;
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
  records: BitableRecords;
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

export interface IBatchQueryParams extends ICommonParams {
  pageSize?: number; // ?????? 500
}

export async function batchQuery(request: APIRequestContext, params: IBatchQueryParams) {
  const { token, app_token, table_id, pageSize = 500 } = params;
  const response = await request.get(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: {
      pageSize,
    }
  });
  const json = await response.json();
  return json;
}

// originRecords ??????????????????
// targetRecords ??????????????????
export function makeRecords(
  originRecords: BitableRecords,
  targetRecords: BitableRecords) {
  const createRecords: BitableRecords = [];
  const updateRecords: BitableRecords = [];
  targetRecords.forEach(target => {
    const origin = (originRecords || []).find(origin => origin.fields['??????'] === target.fields['??????']);
    if (origin) {
      updateRecords.push({ ...target, record_id: origin.record_id });
    } else {
      createRecords.push(target);
    }
  });
  return { createRecords, updateRecords };
}

export async function execute(request: APIRequestContext, params: Omit<IBatchCreateParams, 'token'>) {
  const { tenant_access_token } = await fetchTenantAccessToken(request);

  const commonOptions = {
    token: tenant_access_token,
    app_token: params.app_token,
    table_id: params.table_id,
  };

  const targetRecords = params.records;
  const { data: { items: originRecords } } = await batchQuery(request, commonOptions);

  const { createRecords, updateRecords } = makeRecords(originRecords, targetRecords);
  
  console.table(createRecords.map(it => it.fields));
  console.table(updateRecords.map(it => it.fields));

  const createOptions = {
    ...commonOptions,
    records: createRecords,
  };

  const updateOptions = {
    ...commonOptions,
    records: updateRecords,
  };

  const [createResponse, updateResponse] = await Promise.all([batchCreate(request, createOptions), batchUpdate(request, updateOptions)]);

  console.log('createResponse', createResponse.code === 0 ? createResponse.msg : createResponse);

  console.log('updateResponse', updateResponse.code === 0 ? updateResponse.msg : updateResponse);

  return { createResponse, updateResponse };
}

const getBondType = (btype: JisiluRecord['btype']) => {
  if (btype === 'E') return '????????????';
  return '?????????';
};

export const makeFields = (record: JisiluRecord) => {
  return {
    '??????': record.bond_id,
    '????????????': record.bond_nm,
    '??????': record.price,
    '???????????????': record.premium_rt / 100,
    '??????': record.dblow,
    '????????????': getBondType(record.btype),
    '????????????': record.year_left,
    '????????????': +new Date(`20${record.short_maturity_dt}`),
  };
};
