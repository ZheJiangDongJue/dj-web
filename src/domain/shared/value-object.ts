/**
 *
 * 判断值是否为“对象类型”（包含数组），且非 null。
 * @param value 待判断的值。
 * @returns 若为对象类型且非 null，返回 true。
 *
 */
function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 *
 * 深度冻结（Deep Freeze）对象/数组，以保证值对象的不可变性。
 * @remarks
 * - 对于原始类型直接返回；
 * - 对于对象/数组，会递归冻结其自有可枚举属性。
 * @param value 要冻结的值。
 * @returns 冻结后的只读值。
 *
 */
function deepFreeze<T>(value: T): Readonly<T> {
  if (!isObjectLike(value)) return value as Readonly<T>

  if (Object.isFrozen(value)) return value as Readonly<T>

  Object.freeze(value)

  for (const key of Object.keys(value)) {
    deepFreeze((value as Record<string, unknown>)[key])
  }

  return value as Readonly<T>
}

/**
 *
 * 深度相等性比较（Deep Equal）。
 * @remarks
 * 该实现用于值对象的“值相等”判定，支持：
 * - 原始类型（含 NaN，通过 Object.is 处理）
 * - 数组
 * - 纯对象（以自有可枚举键为准）
 * - Date（按时间戳比较）
 * @param a 左值。
 * @param b 右值。
 * @returns 若深度相等返回 true，否则返回 false。
 *
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (!isObjectLike(a) || !isObjectLike(b)) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }

  return true
}

/**
 *
 * DDD 值对象（Value Object）基类。
 * @remarks
 * 值对象以“属性值”作为相等性判定依据，且应保持不可变。
 *
 */
 export abstract class ValueObject<TProps> {

/**
 *
 * 值对象的属性集合（只读）。
 *
 */
 protected readonly props: Readonly<TProps>

/**
 *
 * 创建值对象实例，并对属性进行深度冻结以确保不可变性。
 * @param props 值对象属性集合。
 *
 */
  protected constructor(props: TProps) {
    this.props = deepFreeze(props)
  }

  /**
   *
   * 比较两个值对象是否相等（按属性值比较）。
   * @param other 要比较的另一个值对象。
   * @returns 若属性值完全一致返回 true，否则返回 false。
   *
   */
  public equals(other: ValueObject<TProps> | null | undefined): boolean {
    if (!other) return false
    if (other === this) return true
    if (other.constructor !== this.constructor) return false
    return deepEqual(this.props, other.props)
  }
}

