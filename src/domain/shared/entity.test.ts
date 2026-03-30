import { describe, it, expect } from 'vitest'
import { Entity } from './entity'

class User extends Entity<number> {
  public constructor(id: number) {
    super(id)
  }
}

class Order extends Entity<number> {
  public constructor(id: number) {
    super(id)
  }
}

describe('Entity', () => {
  it('equals: 传入 null/undefined 返回 false', () => {
    const entity = new User(1)
    expect(entity.equals(null)).toBe(false)
    expect(entity.equals(undefined)).toBe(false)
  })

  it('equals: 同一引用返回 true', () => {
    const entity = new User(1)
    expect(entity.equals(entity)).toBe(true)
  })

  it('equals: 同类型同 Id 返回 true', () => {
    expect(new User(1).equals(new User(1))).toBe(true)
  })

  it('equals: 同类型不同 Id 返回 false', () => {
    expect(new User(1).equals(new User(2))).toBe(false)
  })

  it('equals: 不同类型（构造函数不同）即使 Id 相同也返回 false', () => {
    const a = new User(1)
    const b = new Order(1)
    expect(a.equals(b as unknown as Entity<number>)).toBe(false)
  })
})

