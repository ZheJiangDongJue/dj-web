import { fetchLookup, toOptions } from './lookup-core';

export interface DepartmentRecord {
  id: string | number;
  Code?: string;
  Name?: string;
}

/**
 *
 * 部门联查：返回下拉选项（label/value）。
 *
 */
export async function fetchDepartments(signal?: AbortSignal) {
  const rows = (await fetchLookup('Department', ['id', 'Code', 'Name'], 'Name asc, Code asc', signal)) as DepartmentRecord[];
  return toOptions(rows);
}
