/**
 *
 * DDD 实体（Entity）基类。
 * @remarks
 * 实体以“标识（Id）”作为唯一身份判定依据，业务属性可在生命周期内变化。
 *
 */
 export abstract class Entity<TId> {

/**
 *
 * 实体标识。
 *
 */
 protected readonly _id: TId

/**
 *
 * 创建实体实例。
 * @param id 实体唯一标识。
 *
 */
  protected constructor(id: TId) {
    this._id = id
  }

  /**
   *
   * 获取实体标识。
   *
   */
 public get id(): TId {
 return this._id
 }

/**
 *
 * 比较两个实体是否相等。
 * @remarks
 * 规则：
 * 1) 同一引用必然相等；
 * 2) 不同引用时，要求“同类型 + 同 Id”。
 * @param other 要比较的另一个实体。
 * @returns 若相等返回 true，否则返回 false。
 *
 */
  public equals(other: Entity<TId> | null | undefined): boolean {
    if (!other) return false
    if (other === this) return true
    if (other.constructor !== this.constructor) return false
    return Object.is(this._id, other._id)
  }
}

