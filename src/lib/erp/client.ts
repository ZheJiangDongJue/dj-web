import { fetchLookup, toOptions } from './lookup-core';

export interface ClientRecord {
  id: string | number;
  Code?: string;
  Name?: string;
}

/**
 *
 * 客户联查：返回下拉选项（label/value）。
 *
 */
export async function fetchClients(signal?: AbortSignal) {
  const rows = (await fetchLookup('Client', ['id', 'Code', 'Name'], 'Name asc, Code asc', signal)) as ClientRecord[];
  return toOptions(rows);
}
