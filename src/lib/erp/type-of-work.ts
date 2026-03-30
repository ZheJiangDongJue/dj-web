import { fetchLookup } from './lookup-core';

export interface WorkTypeRecord {
  id: string | number;
  Name?: string;
  Code?: string;
}

/**
 *
 * 工种联查：返回下拉选项（label/value）。
 *
 */
export async function fetchWorkTypes(signal?: AbortSignal) {
  const rows = (await fetchLookup(
    'TypeofWork',
    ['id', 'Name', 'Code'],
    'Name asc',
    { where: ['DeletedTag = 0', 'IsPause = 0'] },
    signal,
  )) as WorkTypeRecord[];
  return toOptions(rows);
}

function toOptions<T extends Record<string, any>>(
  items: T[]
): Array<{ label: string; value: string | number; raw: T }> {
  return (items ?? []).map((row) => {
    const id = (row?.id ?? row?.Id ?? row?.ID) as string | number | undefined;
    const name = row?.Name ?? row?.name ?? row?.Title ?? row?.Label;
    const code = row?.Code ?? row?.code;
    const label = (name ?? code ?? String(id ?? '')) as string;

    var resultName = name;
    if(row.content != null){
      resultName += `(${row.content})`;
    }
    return { label: resultName, value: id ?? label, raw: row };
  });
}