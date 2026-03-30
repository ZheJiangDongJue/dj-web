import { fetchLookup, toOptions } from './lookup-core';

export interface CheckMethodRecord {
  id: string | number;
  Name?: string;
  Code?: string;
}

/**
 *
 * 检验方式联查：返回下拉选项（label/value）。
 *
 */
export async function fetchCheckMethods(signal?: AbortSignal) {
  const rows = (await fetchLookup('CheckMethod', ['id', 'Name', 'Code'], 'Name asc', signal)) as CheckMethodRecord[];
  return toOptions(rows);
}
