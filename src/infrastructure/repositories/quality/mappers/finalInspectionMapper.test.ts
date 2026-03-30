import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/types/erp-db.generated', () => {
  class FinalInspectionDocument {
    public id?: unknown
    public defaultsTouched = false

    public initDefaults() {
      this.defaultsTouched = true
    }
  }

  class FinalInspectionDetail {
    public id?: unknown
    public defaultsTouched = false

    public initDefaults() {
      this.defaultsTouched = true
    }
  }

  return { FinalInspectionDocument, FinalInspectionDetail }
})

describe('finalInspectionMapper', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('toDomain: 映射单据头与明细，处理字段大小写与数量拆分', async () => {
    const { FinalInspectionMapper } = await import('./finalInspectionMapper')

    const rawDocument = {
      Id: '123',
      Status: 8,
      CreateByDocumentid: 555,
      CreateByDocumentType: 'ProcessAssemblyFlowDocument',
      CreateByDetailid: 666,
      CreateByDetailType: 'ProcessAssemblyFlowDetail',
      Materialid: 1,
      Departmentid: 2,
      Employeeid: 3,
      Clientid: 4,
      CheckMethodid: 5,
      CheckCaseDocumentid: 6,
      HandlingMethodid: 7,
      CheckDeliveryTime: '2020-01-01 00:00:00',
      CheckResult: 2,
      PreCmpBQty: 9,
      ChkBQty: 10,
      PassBQty: 6,
      RQty: 2,
      NotPassBQty: 2,
      Cname: '客户',
      InnerKey: 'key',
      SeverityLevel: 11,
      TypeofWorkid: 12,
      Qty: 13,
    }

    const details = [
      {
        id: 1,
        ProjectName: 'p1',
        Content: 'c1',
        ChkBQty: 5,
        PassBQty: 3,
        PassRate: 50,
        CheckResult: 4,
        AQL: 'a',
        ACRE: 'b',
        Method: 'm',
        Frequency: 'f',
        MeasuredRecord1: '1',
        MeasuredRecord2: '2',
        MeasuredRecord3: '3',
        MeasuredRecord4: '4',
        MeasuredRecord5: '5',
        DownQValue: 'd',
        UpQValue: 'u',
        CmpQValue: 'c',
      },
      { Content: 'missing id', ChkBQty: 2, PassBQty: 1, CheckResult: 1 },
      { id: 1, Content: 'duplicate id', ChkBQty: 1, PassBQty: 1, CheckResult: 1 },
    ]

    const aggregate = FinalInspectionMapper.toDomain({ document: rawDocument, details, fallbackId: 99 })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.id).toBe(123)
    expect(aggregate?.status).toBe(8)
    expect(aggregate?.createByDocumentId).toBe(555)
    expect(aggregate?.createByDocumentType).toBe('ProcessAssemblyFlowDocument')
    expect(aggregate?.createByDetailId).toBe(666)
    expect(aggregate?.createByDetailType).toBe('ProcessAssemblyFlowDetail')
    expect(aggregate?.employeeId).toBe(3)
    expect(aggregate?.quantitySplit.inspectQuantity).toBe(10)
    expect(aggregate?.quantitySplit.okQuantity).toBe(6)
    expect(aggregate?.quantitySplit.concessionQuantity).toBe(2)
    expect(aggregate?.quantitySplit.ngQuantity).toBe(2)
    expect(aggregate?.details).toHaveLength(3)
    expect(aggregate?.details[0].id).toBe(1)
    expect(aggregate?.details[0].quantitySplit.inspectQuantity).toBe(5)
    expect(aggregate?.details[0].quantitySplit.ngQuantity).toBe(2)
    expect(aggregate?.details[1].id).toBe(-1)
    expect(aggregate?.details[2].id).toBe(-2)
  })

  it('toDomain: 单据头缺失且明细为空时返回 null，并回退 Id', async () => {
    const { FinalInspectionMapper } = await import('./finalInspectionMapper')
    const entity = FinalInspectionMapper.toDomain({ document: null, details: [], fallbackId: 7 })
    expect(entity).toBeNull()
  })

  it('toDomain: 检验数与拆分不一致时自动修正为拆分和', async () => {
    const { FinalInspectionMapper } = await import('./finalInspectionMapper')

    const entity = FinalInspectionMapper.toDomain({
      document: { Id: 1, ChkBQty: 1, PassBQty: 0, RQty: 0, NotPassBQty: 2 },
      details: [],
      fallbackId: 1,
    })

    expect(entity).not.toBeNull()
    expect(entity?.quantitySplit.inspectQuantity).toBe(2)
    expect(entity?.quantitySplit.ngQuantity).toBe(2)
  })

  it('toPersistence: 展开值对象，填充 initDefaults 与合格率', async () => {
    const { FinalInspectionMapper } = await import('./finalInspectionMapper')
    const { FinalInspection } = await import('@/domain/quality/fqc/entities/FinalInspection')
    const { FinalInspectionDetail } = await import('@/domain/quality/fqc/entities/FinalInspectionDetail')
    const { InspectionQuantitySplit } = await import('@/domain/quality/fqc/value-objects/InspectionQuantitySplit')
    const { InspectionResult } = await import('@/domain/quality/fqc/value-objects/InspectionResult')
    const { MeasureRecords } = await import('@/domain/quality/fqc/value-objects/MeasureRecords')

    const detail = new FinalInspectionDetail({
      id: 0,
      projectName: 'p',
      content: 'c',
      quantitySplit: InspectionQuantitySplit.create({ inspectQuantity: 4, okQuantity: 2, concessionQuantity: 1, ngQuantity: 1 }),
      result: InspectionResult.from(4),
      aql: 'a',
      acre: 'b',
      method: 'm',
      frequency: 'f',
      measureRecords: MeasureRecords.from(['1', '2']),
      downQValue: 'd',
      upQValue: 'u',
      cmpQValue: 'c',
      passRate: 0,
    })

    const aggregate = new FinalInspection({
      id: 0,
      createByDocumentId: 11,
      createByDocumentType: 'Doc',
      createByDetailId: -1,
      createByDetailType: 'Detail',
      status: 1,
      materialId: 2,
      departmentId: 3,
      employeeId: 4,
      clientId: 5,
      checkMethodId: 6,
      checkCaseDocumentId: 7,
      handlingMethodId: 8,
      checkDeliveryTime: '2020-01-01 00:00:00',
      result: InspectionResult.from(2),
      preCompleteBadQty: 9,
      quantitySplit: InspectionQuantitySplit.create({ inspectQuantity: 5, okQuantity: 3, concessionQuantity: 1, ngQuantity: 1 }),
      cname: '客户',
      innerKey: 'key',
      severityLevel: 10,
      typeOfWorkId: 11,
      qty: 12,
      details: [detail],
    })

    const dto = FinalInspectionMapper.toPersistence(aggregate)
    const bill = dto.document as any
    const detailDto = dto.details[0] as any

    expect(bill.defaultsTouched).toBe(true)
    expect(bill.Status).toBe(1)
    expect(bill.CreateByDocumentid).toBe(11)
    expect(bill.CreateByDocumentType).toBe('Doc')
    expect(bill.CreateByDetailid).toBe(-1)
    expect(bill.CreateByDetailType).toBe('Detail')
    expect(bill.Materialid).toBe(2)
    expect(bill.PreCmpBQty).toBe(9)
    expect(bill.ChkBQty).toBe(5)
    expect(bill.RQty).toBe(1)
    expect(bill.NotPassBQty).toBe(1)

    expect(detailDto.defaultsTouched).toBe(true)
    expect(detailDto.id).toBe(0)
    expect(detailDto.ChkBQty).toBe(4)
    expect(detailDto.PassBQty).toBe(2)
    expect(detailDto.PassRate).toBeGreaterThan(0)
    expect(detailDto.MeasuredRecord3).toBe('')
  })
})
