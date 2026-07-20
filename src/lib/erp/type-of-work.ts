import { fetchLookup } from './lookup-core';

export interface WorkTypeRecord {
  id?: string | number;
  Id?: string | number;
  ID?: string | number;
  Name?: string;
  name?: string;
  Title?: string;
  Label?: string;
  Code?: string;
  code?: string;
  Content?: string;
  content?: string;
}

export interface WorkTypeOption {
  label: string;
  value: string | number;
  raw: WorkTypeRecord;
  /** TypeofWork.Content，用于业务下拉的内容列展示。 */
  workTypeContent?: string;
}

/**
 *
 * 工种联查：返回下拉选项（label/value/content）。
 *
 */
export async function fetchWorkTypes(signal?: AbortSignal) {
  const rows = (await fetchLookup(
    'TypeofWork',
    ['id', 'Name', 'Code', 'Content'],
    'Name asc',
    { where: ['DeletedTag = 0', 'IsPause = 0'] },
    signal,
  )) as WorkTypeRecord[];
  return toOptions(rows);
}

function toOptions(
  items: WorkTypeRecord[]
): WorkTypeOption[] {
  return (items ?? []).map((row) => {
    const id = (row?.id ?? row?.Id ?? row?.ID) as string | number | undefined;
    const name = row?.Name ?? row?.name ?? row?.Title ?? row?.Label;
    const code = row?.Code ?? row?.code;
    const label = (name ?? code ?? String(id ?? '')) as string;
    const workTypeContent = String(row?.Content ?? row?.content ?? '').trim();

    return {
      label,
      value: id ?? label,
      raw: row,
      ...(workTypeContent ? { workTypeContent } : {}),
    };
  });
}
