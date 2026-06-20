/**
 *
 * NCR 扫码动作类型。
 *
 */
 export type NcrScanCommandType =
 | 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID'
 | 'SET_INSPECTOR_BY_EMPLOYEE_SCAN_CODE'
 | 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE'
 | 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE'
 | 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE'

/**
 *
 * 打开指定 NCR 单据的命令。
 *
 */
 export type OpenDefectiveReworkOrderByIdCommand = {

/**
 *
 * 命令类型。
 *
 */
  readonly type: 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID'
  /**
   *
   * 单据主键（正整数）。
   *
   */
  readonly id: number
}

/**
 *
 * 通过“职员条码”设置检验员的命令。
 * @remarks
 * 说明：职员条码的解析仅负责识别“这是职员码”，具体查找职员与落到单据字段由 Application 层完成。\\n
 *
 */
 export type SetInspectorByEmployeeScanCodeCommand = {

/**
 *
 * 命令类型。
 *
 */
  readonly type: 'SET_INSPECTOR_BY_EMPLOYEE_SCAN_CODE'
  /**
   *
   * 职员条码文本（原样保留）。
   *
   */
  readonly scanCode: string
}

/**
 *
 * 通过“日计划条码”生成 NCR 的命令。
 * @remarks
 * - 对齐后端日计划草稿接口的关键输入字段（ScanForCode/InspectorEmployeeid）；\\n
 * - 领域层不包含 dbName/user 等基础设施信息；这些由 Application 层补齐。\\n
 *
 */
 export type CreateDefectiveReworkOrderCommand = {

/**
 *
 * 命令类型。
 *
 */
  readonly type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE'
  /**
   *
   * 日计划明细扫码码（对应后端字段 ScanForCode）。
   *
   */
  readonly scanForCode: string
  /**
   *
   * 可选：检验员员工ID（Employeeid）。
   *
   */
  readonly inspectorEmployeeId?: number
}

/**
 *
 * 通过“挤出计划条码”生成 NCR 的命令。
 * @remarks
 * - 对齐既有后端接口 `FlowScanApi.CheckDocumentState` 的关键输入字段（ScanForCode）；\\n
 * - 领域层不包含 dbName/user 等基础设施信息；这些由 Application 层补齐。\\n
 *
 */
 export type CreateDefectiveReworkOrderByExtrusionPlanScanCodeCommand = {

/**
 *
 * 命令类型。
 *
 */
  readonly type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE'
  /**
   *
   * 挤出计划明细扫码码（对应后端字段 ScanForCode）。
   *
   */
  readonly scanForCode: string
  /**
   *
   * 可选：检验员员工ID（Employeeid）。
   *
   */
  readonly inspectorEmployeeId?: number
}

/**
 *
 * 通过“不合格返工单条码（FGD-*）”继续生成/打开下游 NCR 的命令。
 * @remarks
 * - 上游入口为不合格返工单（FGD-*），后续逻辑需先定位其下游流程卡与当前工序明细；\\n
 * - 实际的生成/打开由 Application 层通过 FlowScanApi + NCR 草稿接口完成。\\n
 *
 */
export type CreateDefectiveReworkOrderByDefectiveReworkOrderScanCodeCommand = {
  readonly type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE'
  readonly scanForCode: string
  readonly inspectorEmployeeId?: number
}

/**
 *
 * NCR 扫码解析输出命令（联合类型）。
 *
 */
 export type NcrScanCommand =
 | OpenDefectiveReworkOrderByIdCommand
 | SetInspectorByEmployeeScanCodeCommand
 | CreateDefectiveReworkOrderCommand
 | CreateDefectiveReworkOrderByExtrusionPlanScanCodeCommand
 | CreateDefectiveReworkOrderByDefectiveReworkOrderScanCodeCommand

/**
 *
 * NCR 扫码解析错误码。
 *
 */
 export type NcrScanErrorCode = 'EMPTY' | 'INVALID_ID' | 'UNSUPPORTED'

/**
 *
 * NCR 扫码解析错误信息。
 *
 */
 export type NcrScanError = {

/**
 *
 * 错误码。
 *
 */
  readonly code: NcrScanErrorCode
  /**
   *
   * 错误信息。
   *
   */
  readonly message: string
}

/**
 *
 * NCR 扫码解析结果（成功/失败）。
 *
 */
 export type NcrScanParseResult =
 | {

/**
 *
 * 是否成功。
 *
 */
      readonly ok: true
      /**
       *
       * 解析得到的领域命令。
       *
       */
      readonly command: NcrScanCommand
    }
  | {
      /**
       *
       * 是否成功。
       *
       */
      readonly ok: false
      /**
       *
       * 错误信息。
       *
       */
      readonly error: NcrScanError
    }

/**
 *
 * NCR 扫码解析上下文（由上层可选传入）。
 *
 */
 export type NcrScanContext = {

/**
 *
 * 当前已选的检验员员工ID（用于生成 NCR 时透传给后端）。
 *
 */
 readonly inspectorEmployeeId?: number | null
 }

/**
 *
 * NCR 扫码领域服务：将扫码文本解析为“领域命令”。
 * @remarks
 * - 该服务只做“字符串解析与格式校验”，不做任何 IO；\\n
 * - 解析规则对齐现有 ViewModel：支持 id/职员码/日计划码三类。\\n
 *
 */
 export class NcrScanService {

/**
 *
 * 解析扫码文本为领域命令。
 * @param text 扫码/手动输入文本。
 * @param context 可选上下文。
 * @returns 解析结果。
 *
 */
  public static parse(text: string, context?: NcrScanContext): NcrScanParseResult {
    const raw = String(text ?? '').trim()
    if (!raw) {
      return { ok: false, error: { code: 'EMPTY', message: '扫描内容为空' } }
    }

    // 1) 支持：`id:123` / `id：123` / `123`
    const idMatch = raw.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
    if (idMatch) {
      const id = Number(idMatch[1])
      if (Number.isFinite(id) && Number.isInteger(id) && id > 0 && id <= Number.MAX_SAFE_INTEGER) {
        return { ok: true, command: { type: 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID', id } }
      }
      return { ok: false, error: { code: 'INVALID_ID', message: '单据ID不合法' } }
    }

    // 2) 职员条码：包含 “ZY-”
    if (raw.toUpperCase().includes('ZY-')) {
      return { ok: true, command: { type: 'SET_INSPECTOR_BY_EMPLOYEE_SCAN_CODE', scanCode: raw } }
    }

    // 3) 日计划条码：以 “RJH” 开头
    if (/^RJH/i.test(raw)) {
      const inspector = normalizeOptionalPositiveInt(context?.inspectorEmployeeId)
      const command: CreateDefectiveReworkOrderCommand = inspector
        ? { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE', scanForCode: raw, inspectorEmployeeId: inspector }
        : { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE', scanForCode: raw }
      return { ok: true, command }
    }

    // 4) 挤出计划条码：以 “JCJH” 开头
    if (/^JCJH/i.test(raw)) {
      const inspector = normalizeOptionalPositiveInt(context?.inspectorEmployeeId)
      const command: CreateDefectiveReworkOrderByExtrusionPlanScanCodeCommand = inspector
        ? { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE', scanForCode: raw, inspectorEmployeeId: inspector }
        : { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE', scanForCode: raw }
      return { ok: true, command }
    }

    // 5) 返工单条码：以 “FGD” 开头
    if (/^FGD/i.test(raw)) {
      const inspector = normalizeOptionalPositiveInt(context?.inspectorEmployeeId)
      const command: CreateDefectiveReworkOrderByDefectiveReworkOrderScanCodeCommand = inspector
        ? { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE', scanForCode: raw, inspectorEmployeeId: inspector }
        : { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE', scanForCode: raw }
      return { ok: true, command }
    }

    return { ok: false, error: { code: 'UNSUPPORTED', message: '暂不支持该条码' } }
  }
}

/**
 *
 * 将“可能为数字/字符串/空”的输入归一化为“正整数或 null”。
 * @param value 输入值。
 * @returns 正整数或 null。
 *
 */
function normalizeOptionalPositiveInt(value: number | null | undefined): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null
  if (n > Number.MAX_SAFE_INTEGER) return null
  return n
}
