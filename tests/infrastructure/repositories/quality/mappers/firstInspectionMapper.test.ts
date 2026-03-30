import { describe, expect, it } from 'vitest'
import { FirstInspectionMapper } from '../../../../../src/infrastructure/repositories/quality/mappers/firstInspectionMapper'

describe('FirstInspectionMapper', () => {
  it('toDomain supports camelCase Document/Details keys', () => {
    const entity = FirstInspectionMapper.toDomain({
      document: {
        id: 10,
        documentStatus: 1,
        materialid: 59810,
        departmentid: 1,
        employeeid: 2,
        clientid: 3,
        checkMethodid: 4,
        checkCaseDocumentid: 5,
        handlingMethodid: 6,
        checkDeliveryTime: '2026-01-01',
        checkResult: 1,
        preCmpBQty: 0,
        chkBQty: 5,
        passBQty: 5,
        rQty: 0,
        notPassBQty: 0,
        cname: '客户A',
        innerKey: 'IK001',
        severityLevel: 1,
        typeofWorkid: 7,
        qty: 100,
      },
      details: [
        {
          id: 1,
          projectName: '尺寸A',
          content: '10.00 ± 0.20',
          chkBQty: 5,
          passBQty: 5,
          passRate: 100,
          checkResult: 1,
          aql: '1.0',
          acre: '2.0',
          method: '卡尺',
          frequency: '3',
          measuredRecord1: '10.01',
          measuredRecord2: '9.99',
          measuredRecord3: '10.02',
          measuredRecord4: '',
          measuredRecord5: '',
          downQValue: '9.8',
          upQValue: '10.2',
          cmpQValue: '10.0',
        },
      ],
      fallbackId: 10,
    })

    expect(entity).not.toBeNull()
    if (!entity) return

    expect(entity.id).toBe(10)
    expect(entity.status).toBe(1)
    expect(entity.materialId).toBe(59810)
    expect(entity.employeeId).toBe(2)
    expect(entity.quantitySplit.inspectQuantity).toBe(5)
    expect(entity.quantitySplit.okQuantity).toBe(5)

    expect(entity.details).toHaveLength(1)
    const [detail] = entity.details
    expect(detail.projectName).toBe('尺寸A')
    expect(detail.content).toBe('10.00 ± 0.20')
    expect(detail.method).toBe('卡尺')
    expect(detail.frequency).toBe('3')
    expect(detail.downQValue).toBe('9.8')
    expect(detail.upQValue).toBe('10.2')
    expect(detail.cmpQValue).toBe('10.0')
    expect(detail.measureRecords.toFixedLength()).toEqual(['10.01', '9.99', '10.02', '', ''])

    const persistence = FirstInspectionMapper.toPersistence(entity)
    expect(persistence.document.Materialid).toBe(59810)
    expect(persistence.document.Employeeid).toBe(2)
    expect(persistence.document.ChkBQty).toBe(5)
    expect(persistence.document.PassBQty).toBe(5)

    expect(persistence.details).toHaveLength(1)
    expect(persistence.details[0]!.ProjectName).toBe('尺寸A')
    expect(persistence.details[0]!.Content).toBe('10.00 ± 0.20')
    expect(persistence.details[0]!.Method).toBe('卡尺')
    expect(persistence.details[0]!.Frequency).toBe('3')
    expect(persistence.details[0]!.MeasuredRecord1).toBe('10.01')
  })
})

