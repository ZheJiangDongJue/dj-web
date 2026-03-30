import { describe, it, expect } from 'vitest'
import { DefectiveReworkOrder as OrderFromRepo } from './DefectiveReworkOrderRepository'
import { DefectiveReworkOrder as OrderFromEntity } from '../entities/DefectiveReworkOrder'

describe('DefectiveReworkOrderRepository (re-export)', () => {
  it('仓储入口应 re-export 聚合根类型（运行期为同一引用）', () => {
    expect(OrderFromRepo).toBe(OrderFromEntity)
  })
})

