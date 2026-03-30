import { describe, it, expect } from 'vitest'
import { NcrScanService } from './NcrScanService'

describe('NcrScanService', () => {
  it('parse: 空内容返回 EMPTY', () => {
    const result = NcrScanService.parse('   ')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('EMPTY')
  })

  it('parse: 支持 id:123 / id：123 / 123 形式', () => {
    const r1 = NcrScanService.parse('id:123')
    expect(r1).toEqual({ ok: true, command: { type: 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID', id: 123 } })

    const r2 = NcrScanService.parse('id：456')
    expect(r2).toEqual({ ok: true, command: { type: 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID', id: 456 } })

    const r3 = NcrScanService.parse('001')
    expect(r3).toEqual({ ok: true, command: { type: 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID', id: 1 } })
  })

  it('parse: id 非正整数时返回 INVALID_ID', () => {
    const r1 = NcrScanService.parse('id:0')
    expect(r1.ok).toBe(false)
    if (r1.ok) throw new Error('should not reach')
    expect(r1.error.code).toBe('INVALID_ID')

    const r2 = NcrScanService.parse(`id:${Number.MAX_SAFE_INTEGER + 1}`)
    expect(r2.ok).toBe(false)
    if (r2.ok) throw new Error('should not reach')
    expect(r2.error.code).toBe('INVALID_ID')
  })

  it('parse: 识别职员条码（包含 ZY-，大小写不敏感）', () => {
    const r1 = NcrScanService.parse('ZY-EMP-001')
    expect(r1).toEqual({ ok: true, command: { type: 'SET_INSPECTOR_BY_EMPLOYEE_SCAN_CODE', scanCode: 'ZY-EMP-001' } })

    const r2 = NcrScanService.parse('zy-emp-002')
    expect(r2).toEqual({ ok: true, command: { type: 'SET_INSPECTOR_BY_EMPLOYEE_SCAN_CODE', scanCode: 'zy-emp-002' } })
  })

  it('parse: 识别日计划条码（RJH*）并可透传 inspectorEmployeeId', () => {
    const r1 = NcrScanService.parse('RJH-ABC', { inspectorEmployeeId: 100 })
    expect(r1).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE',
        scanForCode: 'RJH-ABC',
        inspectorEmployeeId: 100,
      },
    })

    const r2 = NcrScanService.parse('rjh-xyz', { inspectorEmployeeId: 0 })
    expect(r2).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE',
        scanForCode: 'rjh-xyz',
      },
    })

    const r3 = NcrScanService.parse('RJH-DEF', { inspectorEmployeeId: 1.1 })
    expect(r3).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE',
        scanForCode: 'RJH-DEF',
      },
    })

    const r4 = NcrScanService.parse('RJH-GHI', { inspectorEmployeeId: Number.MAX_SAFE_INTEGER + 1 })
    expect(r4).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE',
        scanForCode: 'RJH-GHI',
      },
    })
  })

  it('parse: 识别挤出计划条码（JCJH*）并可透传 inspectorEmployeeId', () => {
    const r1 = NcrScanService.parse('JCJH-ABC', { inspectorEmployeeId: 100 })
    expect(r1).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE',
        scanForCode: 'JCJH-ABC',
        inspectorEmployeeId: 100,
      },
    })

    const r2 = NcrScanService.parse('jcjh-xyz', { inspectorEmployeeId: 0 })
    expect(r2).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE',
        scanForCode: 'jcjh-xyz',
      },
    })

    const r3 = NcrScanService.parse('JCJH-DEF', { inspectorEmployeeId: 1.1 })
    expect(r3).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE',
        scanForCode: 'JCJH-DEF',
      },
    })

    const r4 = NcrScanService.parse('JCJH-GHI', { inspectorEmployeeId: Number.MAX_SAFE_INTEGER + 1 })
    expect(r4).toEqual({
      ok: true,
      command: {
        type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE',
        scanForCode: 'JCJH-GHI',
      },
    })
  })

  it('parse: 识别返工单条码（FGD-*）', () => {
    const r1 = NcrScanService.parse('FGD-001', { inspectorEmployeeId: 100 })
    expect(r1).toEqual({
      ok: true,
      command: { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE', scanForCode: 'FGD-001', inspectorEmployeeId: 100 },
    })

    const r2 = NcrScanService.parse('fgd-002', { inspectorEmployeeId: 0 })
    expect(r2).toEqual({
      ok: true,
      command: { type: 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE', scanForCode: 'fgd-002' },
    })
  })

  it('parse: 不支持的条码返回 UNSUPPORTED', () => {
    const result = NcrScanService.parse('UNKNOWN-CODE')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('UNSUPPORTED')
  })
})
