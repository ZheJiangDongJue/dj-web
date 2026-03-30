import type { Entity } from './entity'

/**
 *
 * 仓储（Repository）接口。
 * @remarks
 * 仓储是领域层对持久化机制的抽象：领域层只依赖接口，不依赖具体存储实现。
 *
 */
 export interface Repository<TEntity extends Entity<TId>, TId> {

/**
 *
 * 根据 Id 查找实体。
 * @param id 实体标识。
 * @returns 找到返回实体；未找到返回 null。
 *
 */
  findById(id: TId): Promise<TEntity | null>

  /**
   *
   * 查询全部实体。
   * @returns 实体列表。
   *
   */
  findAll(): Promise<TEntity[]>

  /**
   *
   * 创建实体。
   * @param entity 要创建的实体。
   *
   */
  create(entity: TEntity): Promise<void>

  /**
   *
   * 更新实体。
   * @param entity 要更新的实体。
   *
   */
  update(entity: TEntity): Promise<void>

  /**
   *
   * 删除实体。
   * @param id 实体标识。
   *
   */
  delete(id: TId): Promise<void>
}

