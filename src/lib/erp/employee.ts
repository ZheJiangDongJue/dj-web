import { fetchLookup, toOptions } from './lookup-core';

export interface EmployeeRecord {
  id: string | number;
  Code?: string;
  Name?: string;
  EmployeeNumber?: string;
}

/**
 *
 * 员工联查：返回下拉选项（label/value）。
 *
 */
export async function fetchEmployees(signal?: AbortSignal) {
  const rows = (await fetchLookup('Employee', ['id', 'Code', 'Name'], 'Name asc, Code asc', signal)) as EmployeeRecord[];
  return toOptions(rows);
}

/**
 *
 * 有效员工联查：DeletedTag = 0 且 (EmployeeState IS NULL OR EmployeeState <> '已离职')
 * - 与 FQC 页面期望的结构对齐（包含 id/Name 字段）
 * - 额外返回 EmployeeNumber 字段，便于页面显示工号
 *
 */
export async function fetchActiveEmployees(signal?: AbortSignal) {
  const where = [
    'DeletedTag = 0',
    "(EmployeeState IS NULL OR EmployeeState <> '已离职')",
  ];
  const rows = (await fetchLookup(
    'Employee',
    ['id', 'Name', 'EmployeeNumber'],
    'Name asc',
    { where },
    signal,
  )) as EmployeeRecord[];
  return rows;
}
