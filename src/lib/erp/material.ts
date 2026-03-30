import { fetchLookup, toOptions } from './lookup-core';

export interface MaterialRecord {
  id: string | number;
  Code?: string;
  Name?: string;
}

/**
 *
 * 物料联查：返回下拉选项（label/value）。
 *
 */
export async function fetchMaterials(signal?: AbortSignal) {
  const rows = (await fetchLookup('Material', ['id', 'Code', 'Name'], 'Name asc, Code asc', signal)) as MaterialRecord[];
  return toOptions(rows);
}
