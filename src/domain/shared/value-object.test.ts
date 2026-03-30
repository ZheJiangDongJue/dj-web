import { describe, it, expect } from 'vitest'
import { ValueObject } from './value-object'

type MoneyProps = {
  amount: number
  currency: string
  meta: { tags: string[] }
}

class Money extends ValueObject<MoneyProps> {
  public constructor(props: MoneyProps) {
    super(props)
  }

  public get snapshot(): Readonly<MoneyProps> {
    return this.props
  }
}

class MoneyAlt extends ValueObject<MoneyProps> {
  public constructor(props: MoneyProps) {
    super(props)
  }
}

type OccurredAtProps = { at: Date }

class OccurredAt extends ValueObject<OccurredAtProps> {
  public constructor(props: OccurredAtProps) {
    super(props)
  }
}

describe('ValueObject', () => {
  it('构造时会深度冻结 props，保证不可变性', () => {
    const props: MoneyProps = { amount: 1, currency: 'CNY', meta: { tags: ['a'] } }
    const money = new Money(props)

    expect(Object.isFrozen(props)).toBe(true)
    expect(Object.isFrozen(props.meta)).toBe(true)
    expect(Object.isFrozen(props.meta.tags)).toBe(true)

    expect(() => {
      ;(money.snapshot as any).amount = 2
    }).toThrow(TypeError)

    expect(() => {
      ;(money.snapshot as any).meta.tags.push('b')
    }).toThrow(TypeError)
  })

  it('equals: 传入 null/undefined 返回 false', () => {
    const a = new Money({ amount: 1, currency: 'CNY', meta: { tags: [] } })
    expect(a.equals(null)).toBe(false)
    expect(a.equals(undefined)).toBe(false)
  })

  it('equals: 同一引用返回 true', () => {
    const a = new Money({ amount: 1, currency: 'CNY', meta: { tags: [] } })
    expect(a.equals(a)).toBe(true)
  })

  it('equals: 同类型且 props 深度相等返回 true（包含数组）', () => {
    const a = new Money({ amount: 1, currency: 'CNY', meta: { tags: ['a', 'b'] } })
    const b = new Money({ amount: 1, currency: 'CNY', meta: { tags: ['a', 'b'] } })
    expect(a.equals(b)).toBe(true)
  })

  it('equals: Date 按时间戳比较', () => {
    const a = new OccurredAt({ at: new Date('2020-01-01T00:00:00Z') })
    const b = new OccurredAt({ at: new Date('2020-01-01T00:00:00Z') })
    const c = new OccurredAt({ at: new Date('2020-01-02T00:00:00Z') })

    expect(a.equals(b)).toBe(true)
    expect(a.equals(c)).toBe(false)
  })

  it('equals: 不同类型即使 props 相同也返回 false', () => {
    const a = new Money({ amount: 1, currency: 'CNY', meta: { tags: ['a'] } })
    const b = new MoneyAlt({ amount: 1, currency: 'CNY', meta: { tags: ['a'] } })
    expect(a.equals(b as unknown as ValueObject<MoneyProps>)).toBe(false)
  })
})

