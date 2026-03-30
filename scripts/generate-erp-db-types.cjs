#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/**
 *
 * 全局配置的 ERP.Db 根路径。
 * 如需手动指定绝对路径，可将此常量设置为类似：
 *   'D:/Code/DongJue/ERP_csharp/ERP.Db'
 * 若保持为空字符串，则会按约定自动探测。
 * 也可以通过环境变量 ERP_DB_ROOT 覆盖该值。
 * @type {string}
 *
 */
const ERP_DB_ROOT_CONFIG = process.env.ERP_DB_ROOT || '';

/**
 *
 * 获取 ERP.Db 项目的根路径。
 * 会优先使用全局配置，其次尝试从当前工作目录和脚本目录向上搜索。
 *
 */
function getErpDbRoot() {
  /**
   *
   * @type {string[]}
   *
   */
  const candidates = [];

  if (ERP_DB_ROOT_CONFIG && typeof ERP_DB_ROOT_CONFIG === 'string') {
    candidates.push(path.resolve(ERP_DB_ROOT_CONFIG));
  }

  // 相对于脚本所在目录的默认路径（dj-web/scripts -> ../.. -> {workspace}/ERP_csharp/ERP.Db）
  candidates.push(path.resolve(__dirname, '../../ERP_csharp/ERP.Db'));

  // 从当前工作目录向上查找 ERP_csharp/ERP.Db（适配从 dj-web 根目录执行脚本的情况）
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i += 1) {
    const candidate = path.join(currentDir, 'ERP_csharp', 'ERP.Db');
    candidates.push(candidate);
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  // 去重后遍历候选路径
  const uniqueCandidates = Array.from(new Set(candidates));
  for (const candidate of uniqueCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `未找到 ERP.Db 项目目录，尝试的路径如下：\n${uniqueCandidates.join('\n')}`
  );
}

/**
 *
 * 确保目标目录存在，如果不存在则递归创建。
 * @param {string} dirPath 目标目录路径
 *
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 *
 * 递归收集指定目录下的所有 .cs 文件。
 * @param {string} rootDir 根目录
 * @returns {string[]} C# 文件完整路径列表
 *
 */
function collectCsFiles(rootDir) {
  /**
   *
   * @type {string[]}
   *
   */
  const results = [];

  /**
   *
   * 深度优先遍历目录，收集 .cs 文件。
   * @param {string} current 当前遍历路径
   *
   */
  function walk(current) {
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(current);
      for (const entry of entries) {
        const fullPath = path.join(current, entry);
        const baseName = path.basename(fullPath);

        // 跳过常见的编译输出及无关目录
        if (baseName === 'bin' || baseName === 'obj' || baseName === '.git') {
          continue;
        }

        walk(fullPath);
      }
    } else if (stat.isFile() && current.toLowerCase().endsWith('.cs')) {
      results.push(current);
    }
  }

  walk(rootDir);
  return results;
}

/**
 *
 * 判断给定的文件是否属于数据库实体相关目录。
 * 主要用于在导出 TS 类型时对重名类型做优先级判断。
 * @param {string} filePath 文件完整路径
 *
 */
function isEntityRelatedFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/EntityFrameworkCore/') ||
    normalized.includes('/Iterate2024/Entities/')
  );
}

/**
 *
 * 表示从 C# 中解析出的类型定义。
 * @typedef {Object} ParsedType
 * @property {'class'|'interface'|'enum'} kind 类型种类
 * @property {string} name 类型名称（不含命名空间）
 * @property {string|null} namespace 命名空间
 * @property {string} filePath 源文件路径
 * @property {string[]} baseTypes 基类和接口的简单名称列表
 * @property {{ name: string; csharpType: string }[]} properties 类/接口属性列表
 * @property {{ name: string; value?: string }[]} enumMembers 枚举成员列表
 * @property {boolean} [isStaticClass] 是否为 static class（仅对 class 有意义）
 *
 */

/**
 *
 * 解析单个 C# 文件，抽取公共类/接口/枚举定义。
 * @param {string} content 文件内容
 * @param {string} filePath 文件路径
 * @param {Map<string, ParsedType>} typeMap 按 “命名空间.名称” 归档的类型映射
 *
 */
function parseCsFile(content, filePath, typeMap) {
  const lines = content.split(/\r?\n/);

  /**
   *
   * @type {string|null}
   *
   */
  let currentNamespace = null;
  /**
   *
   * @type {ParsedType|null}
   *
   */
  let currentType = null;
  let braceDepth = 0;
  /**
   *
   * @type {{ name: string; csharpType: string } | null}
   *
   */
  let pendingProperty = null;
  let pendingPropertySawBrace = false;

  /**
   *
   * 将解析出的类型合并到 typeMap 中，支持部分类合并。
   * @param {ParsedType} typeDef 解析出的类型定义
   *
   */
  function addOrMergeType(typeDef) {
    const nsPrefix = typeDef.namespace ? typeDef.namespace + '.' : '';
    const key = nsPrefix + typeDef.name;
    const existing = typeMap.get(key);
    if (!existing) {
      typeMap.set(key, typeDef);
      return;
    }

    // 同一命名空间、同名、同 kind 视为部分类，合并属性与枚举成员
    if (existing.kind === typeDef.kind) {
      if (typeDef.baseTypes.length) {
        const mergedBase = new Set([...existing.baseTypes, ...typeDef.baseTypes]);
        existing.baseTypes = Array.from(mergedBase);
      }

      if (typeDef.properties.length) {
        const existingPropNames = new Set(existing.properties.map((p) => p.name));
        for (const prop of typeDef.properties) {
          if (!existingPropNames.has(prop.name)) {
            existing.properties.push(prop);
          }
        }
      }

      if (typeDef.enumMembers.length) {
        const existingMemberNames = new Set(existing.enumMembers.map((m) => m.name));
        for (const m of typeDef.enumMembers) {
          if (!existingMemberNames.has(m.name)) {
            existing.enumMembers.push(m);
          }
        }
      }
      return;
    }

    // 不同 kind 的重名：保留现有定义
    // 这里仅忽略新定义，避免生成无效的重复声明。
  }

  for (const originalLine of lines) {
    const line = originalLine.trim();
    if (!line) continue;

    // 解析命名空间
    if (!currentType) {
      const nsMatch = line.match(/^namespace\s+([A-Za-z0-9_.]+)/);
      if (nsMatch) {
        currentNamespace = nsMatch[1];
        continue;
      }
    }

    // 尚未进入类型定义时尝试匹配 public class/interface/enum
    if (!currentType) {
      const typeMatch = line.match(
        /**
         *
         * 匹配公共类型定义：
         * - 支持修饰符组合，如：public abstract class / public sealed class / public partial class 等
         * - 仅捕获 class/interface/enum 三种类型，其余修饰符通过 (?:[A-Za-z]+\s+)* 吸收
         *
         */
        /^public\s+(?:[A-Za-z]+\s+)*(class|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^<{]+))?/
      );
      if (typeMatch) {
        /**
         *
         * @type {'class'|'interface'|'enum'}
         *
         */
        const kind = /**
        const kind =  *
        const kind =  * const kind =  *
        const kind =  * const kind =  * const kind =  *
        const kind =  * const kind =  * const kind =  * const kind =  * @type any
        const kind =  * const kind =  * const kind =  * const kind =
        const kind =  * const kind =  * const kind =
        const kind =  * const kind =
        const kind =  */
 (typeMatch[1]);
        const name = typeMatch[2];
        const baseRaw = typeMatch[3];
        const baseTypes = [];

        if (baseRaw) {
          for (const raw of baseRaw.split(',')) {
            const cleaned = cleanBaseType(raw);
            if (cleaned) {
              baseTypes.push(cleaned);
            }
          }
        }

        // 判断是否为 static class（用于过滤扩展类/工具类）
        const isStaticCls =
          kind === 'class' && /\bpublic\s+(?:[A-Za-z]+\s+)*static\s+class\b/.test(line);

        currentType = {
          kind,
          name,
          namespace: currentNamespace,
          filePath,
          baseTypes,
          properties: [],
          enumMembers: [],
          isStaticClass: isStaticCls,
        };

        const open = (originalLine.match(/{/g) || []).length;
        const close = (originalLine.match(/}/g) || []).length;
        braceDepth = open - close;
        continue;
      }
    }

    // 解析类型内部内容
    if (currentType) {
      const lineWithoutComments = line.replace(/\/\/.*$/, '').trim();

      if (currentType.kind === 'enum') {
        // 解析枚举成员，跳过特性与右大括号等
        if (
          lineWithoutComments &&
          !lineWithoutComments.startsWith('[') &&
          !lineWithoutComments.startsWith('}') &&
          !lineWithoutComments.startsWith('{') &&
          // 跳过 C# 预处理指令（如 #region/#endregion/#if 等），防止生成非法枚举成员
          !lineWithoutComments.startsWith('#')
        ) {
          const enumMatch = lineWithoutComments.match(
            /^([^\s=,{][^=,{]*)\s*(=\s*([^,]+))?,?\s*$/u
          );
          if (enumMatch) {
            const memberName = enumMatch[1];
            const rawValue = enumMatch[3] ? enumMatch[3].trim() : undefined;
            const memberValue = rawValue
              ? normalizeEnumValueExpression(rawValue)
              : undefined;
            currentType.enumMembers.push({ name: memberName, value: memberValue });
          }
        }
      } else if (currentType.kind === 'class' || currentType.kind === 'interface') {
        // 解析自动属性：public xxx Name { get; set; }
        const maybePropLine = lineWithoutComments
          // 支持同一行内联特性： [NotCopy] public int? UpdateByUserid { get; set; }
          .replace(/^(\[[^\]]*\]\s*)+/, '')
          .trim();

        // 解析多行属性（例如：public decimal Qty { get => ...; set => ...; }）
        if (pendingProperty) {
          if (!pendingPropertySawBrace) {
            if (maybePropLine === '{') {
              pendingPropertySawBrace = true;
            } else if (maybePropLine) {
              pendingProperty = null;
              pendingPropertySawBrace = false;
            }
          } else {
            if (/\bget\b/.test(maybePropLine)) {
              currentType.properties.push(pendingProperty);
              pendingProperty = null;
              pendingPropertySawBrace = false;
            } else if (maybePropLine.startsWith('}')) {
              pendingProperty = null;
              pendingPropertySawBrace = false;
            }
          }
        }

        if (
          maybePropLine &&
          !maybePropLine.startsWith('}') &&
          !maybePropLine.startsWith('{')
        ) {
          const propMatch = maybePropLine.match(
            /^public\s+(?:virtual\s+)?(?:override\s+)?(?:static\s+)?(.+?)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{\s*get\b/
          );
          if (propMatch) {
            const csharpType = propMatch[1].trim();
            const propName = propMatch[2];
            if (!propName.includes('(')) {
              currentType.properties.push({ name: propName, csharpType });
            }
          } else {
            // 支持 “public decimal Qty” + 下一行 “{” 的写法
            const headerMatch = maybePropLine.match(
              /^public\s+(?:virtual\s+)?(?:override\s+)?(?:static\s+)?(.+?)\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/
            );
            if (
              headerMatch &&
              !maybePropLine.includes('(') &&
              !maybePropLine.endsWith(';') &&
              !maybePropLine.includes('=')
            ) {
              const csharpType = headerMatch[1].trim();
              const propName = headerMatch[2];
              if (!currentType.properties.some((p) => p.name === propName)) {
                pendingProperty = { name: propName, csharpType };
                pendingPropertySawBrace = false;
              }
            }
          }
        }
      }

      const open = (originalLine.match(/{/g) || []).length;
      const close = (originalLine.match(/}/g) || []).length;
      braceDepth += open - close;

      if (braceDepth <= 0) {
        addOrMergeType(currentType);
        currentType = null;
        braceDepth = 0;
        pendingProperty = null;
        pendingPropertySawBrace = false;
      }
    }
  }
}

/**
 *
 * 清理基类/接口字符串，提取简单类型名称。
 * 例如："ERP.Db.EntityFrameworkCore.ERPServer.Employee" => "Employee"
 * @param {string} raw 原始基类或接口字符串
 * @returns {string} 简单类型名称
 *
 */
function cleanBaseType(raw) {
  let value = raw.trim();
  if (!value) return '';

  // 去掉泛型参数部分
  const genericIndex = value.indexOf('<');
  if (genericIndex >= 0) {
    value = value.slice(0, genericIndex);
  }

  const parts = value.split('.');
  return parts[parts.length - 1].trim();
}

/**
 *
 * 规范化 C# 枚举值表达式中的数字字面量，使其符合 TypeScript/JavaScript 语法。
 * 主要处理：
 * - 二进制：0b_10_0000 => 0b100000
 * - 十六进制：0x_FF_00 => 0xFF00
 * - 十进制：1_000_000 => 1000000
 * 同时支持包含多个数字和运算符的组合表达式，例如：
 *   0b_10_0000 | 0b_01_0000
 * @param {string} expr 原始枚举值表达式
 * @returns {string} 规范化后的表达式
 *
 */
function normalizeEnumValueExpression(expr) {
  const trimmed = expr.trim();
  if (!trimmed) return trimmed;

  return trimmed.replace(
    /-?(?:0[bB][01_]+|0[xX][0-9a-fA-F_]+|\d[\d_]*)/g,
    (token) => {
      let value = token;
      let sign = '';

      if (value.startsWith('-')) {
        sign = '-';
        value = value.slice(1);
      }

      if (
        /^0[bB][01_]+$/.test(value) ||
        /^0[xX][0-9a-fA-F_]+$/.test(value) ||
        /^\d[\d_]*$/.test(value)
      ) {
        const cleaned = value.replace(/_/g, '');
        return sign + cleaned;
      }

      return token;
    }
  );
}

/**
 *
 * 根据解析结果构建最终要导出的类型列表，并处理重名冲突。
 * @param {Map<string, ParsedType>} typeMap 按命名空间+名称索引的类型映射
 * @returns {ParsedType[]} 经过去重处理的类型定义列表
 *
 */
function buildFinalTypes(typeMap) {
  /**
   *
   * @type {Map<string, ParsedType[]>}
   *
   */
  const groupedByName = new Map();

  for (const typeDef of typeMap.values()) {
    // 过滤无用的静态类（例如 *Extensions），通常仅包含静态方法/扩展方法，对前端实体映射无意义
    if (typeDef.kind === 'class' && typeDef.isStaticClass === true) {
      continue;
    }
    const list = groupedByName.get(typeDef.name) || [];
    list.push(typeDef);
    groupedByName.set(typeDef.name, list);
  }

  // 先做重名去重：同名时按优先级选择一个保留
  /**
   *
   * @type {ParsedType[]}
   *
   */
  const deduped = [];
  for (const [_name, defs] of groupedByName.entries()) {
    if (defs.length === 1) {
      deduped.push(defs[0]);
      continue;
    }

    // 对重名类型进行优先级排序：实体相关文件 > 其他；其次按命名空间稳定化
    const sorted = defs.slice().sort((a, b) => {
      const scoreA = getTypePriorityScore(a);
      const scoreB = getTypePriorityScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (a.namespace || '').localeCompare(b.namespace || '');
    });
    deduped.push(sorted[0]);
  }

  // 建立名称 -> 类型 的快速索引
  /**
   *
   * @type {Map<string, ParsedType>}
   *
   */
  const nameToType = new Map(deduped.map((t) => [t.name, t]));

  // 分组：按 kind 拆分，避免运行时带来不必要的耦合
  /**
   *
   * @type {ParsedType[]}
   *
   */
  const enums = [];
  /**
   *
   * @type {ParsedType[]}
   *
   */
  const interfaces = [];
  /**
   *
   * @type {ParsedType[]}
   *
   */
  const classes = [];

  for (const t of deduped) {
    if (t.kind === 'enum') enums.push(t);
    else if (t.kind === 'interface') interfaces.push(t);
    else if (t.kind === 'class') classes.push(t);
  }

  // 稳定排序（非运行时相关）
  enums.sort((a, b) => a.name.localeCompare(b.name));
  interfaces.sort((a, b) => a.name.localeCompare(b.name));

  // ——核心：对类做拓扑排序，确保父类先、子类后——
  /**
   *
   * 获取类的直接基类名称；若没有或未知，返回 null。
   * @param {ParsedType} typeDef
   * @returns {string|null}
   *
   */
  function getBaseClassName(typeDef) {
    if (!typeDef || typeDef.kind !== 'class') return null;
    const bases = Array.isArray(typeDef.baseTypes) ? typeDef.baseTypes : [];
    for (const baseName of bases) {
      const baseDef = nameToType.get(baseName);
      if (baseDef && baseDef.kind === 'class') {
        return baseName;
      }
    }
    return null;
  }

  /**
   *
   * Kahn 算法：按类继承关系（父 -> 子）进行拓扑排序。
   * 若存在未知父类或异常，则回退为名称排序，但依然尽可能输出“已解出的顺序”。
   * @param {ParsedType[]} classList
   * @returns {ParsedType[]}
   *
   */
  function topoSortClasses(classList) {
    /**
     *
     * @type {Map<string, number>}
     *
     */
    const indegree = new Map();
    /**
     *
     * @type {Map<string, string[]>}
     *
     */
    const graph = new Map();

    for (const c of classList) {
      indegree.set(c.name, 0);
      graph.set(c.name, []);
    }

    for (const c of classList) {
      const base = getBaseClassName(c);
      if (base && indegree.has(base)) {
        indegree.set(c.name, (indegree.get(c.name) || 0) + 1);
        graph.get(base).push(c.name);
      }
    }

    /**
     *
     * @type {string[]}
     *
     */
    const queue = [];
    for (const [name, deg] of indegree.entries()) {
      if (deg === 0) queue.push(name);
    }
    queue.sort((a, b) => a.localeCompare(b));

    /**
     *
     * @type {string[]}
     *
     */
    const orderedNames = [];
    while (queue.length) {
      const name = queue.shift();
      orderedNames.push(name);
      const nexts = graph.get(name) || [];
      for (const v of nexts) {
        indegree.set(v, (indegree.get(v) || 0) - 1);
        if (indegree.get(v) === 0) {
          queue.push(v);
          // 维持确定性顺序
          queue.sort((a, b) => a.localeCompare(b));
        }
      }
    }

    // 若仍有未输出的（理论上不存在类循环，但以健壮性为先），则补齐按名称排序
    if (orderedNames.length !== classList.length) {
      const remaining = new Set(classList.map((c) => c.name));
      for (const n of orderedNames) remaining.delete(n);
      const rest = Array.from(remaining).sort((a, b) => a.localeCompare(b));
      orderedNames.push(...rest);
    }

    return orderedNames.map((n) => nameToType.get(n)).filter(Boolean);
  }

  const classesSorted = topoSortClasses(classes);

  // 最终顺序：枚举 -> 接口 -> 类（父 -> 子）
  return [...enums, ...interfaces, ...classesSorted];
}

/**
 *
 * 为类型打分，用于在重名类型中选择“更合适”的定义。
 * @param {ParsedType} typeDef 类型定义
 * @returns {number} 优先级分数
 *
 */
function getTypePriorityScore(typeDef) {
  let score = 0;
  if (isEntityRelatedFile(typeDef.filePath)) score += 4;
  if (typeDef.namespace && typeDef.namespace.includes('EntityFrameworkCore')) score += 2;
  if (typeDef.kind === 'class') score += 1;
  return score;
}

/**
 *
 * 将 C# 类型名称映射为 TypeScript 类型名称。
 * 支持常见值类型、可空类型与集合类型。
 * @param {string} csharpType C# 类型字符串
 * @param {Set<string>} knownTypeNames 已知的类型名称集合（用于判断是否生成引用或回退为 any）
 * @returns {string} TypeScript 类型字符串
 *
 */
function mapCsharpTypeToTs(csharpType, knownTypeNames) {
  let typeText = csharpType.trim();
  let isNullable = false;

  if (!typeText) return 'any';

  if (typeText.endsWith('?')) {
    isNullable = true;
    typeText = typeText.slice(0, -1).trim();
  }

  const nullableMatch = typeText.match(/^Nullable<(.+)>$/i);
  if (nullableMatch) {
    isNullable = true;
    typeText = nullableMatch[1].trim();
  }

  // 处理数组类型，例如 byte[]、int[] 等
  const arrayMatch = typeText.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    const elementType = mapCsharpTypeToTs(arrayMatch[1], knownTypeNames).replace(
      /\s*\|\s*null$/,
      ''
    );
    const tsArray = `${elementType}[]`;
    return isNullable ? `${tsArray} | null` : tsArray;
  }

  // 处理常见泛型类型，例如 List<T>、Dictionary<string, T>
  const genericMatch = typeText.match(/^([A-Za-z0-9_]+)\s*<(.+)>$/);
  if (genericMatch) {
    const genericName = genericMatch[1];
    const argsRaw = genericMatch[2];
    const typeArgs = argsRaw.split(',').map((t) => t.trim());

    if (typeArgs.length === 1 && ['List', 'IList', 'ICollection', 'IEnumerable', 'HashSet'].includes(genericName)) {
      const inner = mapCsharpTypeToTs(typeArgs[0], knownTypeNames).replace(/\s*\|\s*null$/, '');
      const tsArray = `${inner}[]`;
      return isNullable ? `${tsArray} | null` : tsArray;
    }

    if (
      typeArgs.length === 2 &&
      ['Dictionary', 'IDictionary'].includes(genericName)
    ) {
      const valueTs = mapCsharpTypeToTs(typeArgs[1], knownTypeNames).replace(
        /\s*\|\s*null$/,
        ''
      );
      const tsRecord = `Record<string, ${valueTs}>`;
      return isNullable ? `${tsRecord} | null` : tsRecord;
    }

    // 其他复杂泛型，统一降级为 any
    return 'any';
  }

  const simpleName = simplifyTypeName(typeText);
  const lower = simpleName.toLowerCase();
  let tsType = 'any';

  switch (lower) {
    case 'string':
    case 'char':
      tsType = 'string';
      break;
    case 'bool':
    case 'boolean':
      tsType = 'boolean';
      break;
    case 'byte':
    case 'sbyte':
    case 'short':
    case 'ushort':
    case 'int':
    case 'uint':
    case 'long':
    case 'ulong':
    case 'float':
    case 'double':
    case 'decimal':
      tsType = 'number';
      break;
    case 'datetime':
    case 'datetimeoffset':
      tsType = 'string';
      break;
    case 'guid':
      tsType = 'string';
      break;
    case 'object':
      tsType = 'any';
      break;
    default: {
      if (knownTypeNames.has(simpleName)) {
        tsType = simpleName;
      } else {
        tsType = 'any';
      }
      break;
    }
  }

  return isNullable ? `${tsType} | null` : tsType;
}

/**
 *
 * 去掉命名空间与多余修饰，提取简单类型名称。
 * 例如："ERP.Db.Enums.ERPBase.Gender" => "Gender"
 * @param {string} typeText 原始类型字符串
 * @returns {string} 简单类型名称
 *
 */
function simplifyTypeName(typeText) {
  let value = typeText.trim();
  if (!value) return 'any';

  const genericIndex = value.indexOf('<');
  if (genericIndex >= 0) {
    value = value.slice(0, genericIndex);
  }

  const parts = value.split('.');
  return parts[parts.length - 1].trim();
}

/**
 *
 * 判断 C# 类型是否可空，并返回去除可空修饰后的核心类型字符串。
 * @param {string} csharpType C# 类型字符串
 * @returns {{ isNullable: boolean; coreType: string }} 可空性与核心类型
 *
 */
function getCsharpNullabilityInfo(csharpType) {
  let typeText = csharpType.trim();
  let isNullable = false;

  if (!typeText) {
    return { isNullable: false, coreType: '' };
  }

  if (typeText.endsWith('?')) {
    isNullable = true;
    typeText = typeText.slice(0, -1).trim();
  }

  const nullableMatch = typeText.match(/^Nullable<(.+)>$/i);
  if (nullableMatch) {
    isNullable = true;
    typeText = nullableMatch[1].trim();
  }

  return { isNullable, coreType: typeText };
}

/**
 *
 * 为非空的 C# 属性推导一个默认值初始化表达式。
 * 若属性为可空，则返回 null。
 * @param {string} csharpType C# 类型字符串
 * @param {string} tsType 对应的 TypeScript 类型字符串
 * @param {Map<string, ParsedType>} typeByName 按名称索引的类型映射
 * @returns {string|null} 默认值表达式（例如 "''"、"0"、"[]"），无法推导时返回 null
 *
 */
function getDefaultInitializerForProperty(csharpType, tsType, typeByName) {
  const { isNullable, coreType } = getCsharpNullabilityInfo(csharpType);
  if (isNullable) {
    return null;
  }

  if (!tsType) {
    return null;
  }

  const pureTsType = tsType.replace(/\s*\|\s*null$/, '').trim();

  // 数组类型默认值：[]
  if (pureTsType.endsWith('[]')) {
    return '[]';
  }

  // Record<string, T> 默认值：{}
  if (/^Record<string,\s*.+>$/.test(pureTsType)) {
    return '{} as any';
  }

  const simpleName = simplifyTypeName(coreType);
  const lower = simpleName.toLowerCase();

  switch (lower) {
    case 'string':
    case 'char':
    case 'guid':
    case 'datetime':
    case 'datetimeoffset':
      return "''";
    case 'bool':
    case 'boolean':
      return 'false';
    case 'byte':
    case 'sbyte':
    case 'short':
    case 'ushort':
    case 'int':
    case 'uint':
    case 'long':
    case 'ulong':
    case 'float':
    case 'double':
    case 'decimal':
      return '0';
    default: {
      const typeDef = typeByName.get(simpleName);
      if (typeDef && typeDef.kind === 'enum' && typeDef.enumMembers.length > 0) {
        const firstMember = typeDef.enumMembers[0];
        return `${simpleName}.${firstMember.name}`;
      }

      if (typeDef && typeDef.kind === 'class') {
        return `new ${simpleName}()`;
      }

      if (typeDef && typeDef.kind === 'interface') {
        return `{} as ${simpleName}`;
      }

      // 无法可靠推导时不强行给默认值
      return null;
    }
  }
}

/**
 *
 * 根据解析出的类型定义列表生成 TypeScript 源码。
 * @param {ParsedType[]} types 要生成的类型定义列表
 * @returns {string} TypeScript 文件内容
 *
 */
function generateTsSource(types) {
  const knownTypeNames = new Set(types.map((t) => t.name));
  const typeByName = new Map(types.map((t) => [t.name, t]));

  const lines = [];
  lines.push('// 此文件由 scripts/generate-erp-db-types.cjs 自动生成，请勿手动修改。');
  lines.push('// 源：ERP_csharp/ERP.Db');
  lines.push(`// 生成时间：${new Date().toISOString()}`);
  lines.push('');
  lines.push('/* eslint-disable */');
  lines.push('');

  // 为外部不可解析的父类生成占位（例如 Record）
  const externalBaseClassStubs = new Set();
  for (const t of types) {
    if (t.kind !== 'class') continue;
    const basesAll = Array.isArray(t.baseTypes) ? t.baseTypes : [];
    if (basesAll.includes('Record') && !typeByName.has('Record')) {
      externalBaseClassStubs.add('Record');
    }
  }

  for (const name of Array.from(externalBaseClassStubs).sort()) {
    const exportName = name === 'Record' ? 'ErpRecord' : name;
    lines.push(`// 外部基类占位：${name}`);
    lines.push(`export class ${exportName} {`);
    if (name === 'Record') {
      lines.push('  /**');
      lines.push('   * 兼容 IUniqueEntity：部分实体继承 Record 并实现 IUniqueEntity（Uid 在基类中提供）。');
      lines.push('   */');
      lines.push('  Uid!: number;');
    }
    lines.push('  /**');
    lines.push('   * 占位基类：源于 ERP 外部程序集，仅用于保持继承关系。');
    lines.push('   */');
    lines.push('  initDefaults(): void {}');
    lines.push('}');
    lines.push('');
  }

  for (const typeDef of types) {
    const relativePath = path
      .relative(process.cwd(), typeDef.filePath)
      .replace(/\\/g, '/');
    lines.push(`// 来自: ${relativePath}`);

    if (typeDef.kind === 'enum') {
      lines.push(`export enum ${typeDef.name} {`);
      for (const member of typeDef.enumMembers) {
        if (member.value) {
          lines.push(`  ${member.name} = ${member.value},`);
        } else {
          lines.push(`  ${member.name},`);
        }
      }
      lines.push('}');
      lines.push('');
      continue;
    }

    if (typeDef.kind === 'interface') {
      const baseInterfaces = (typeDef.baseTypes || []).filter((b) =>
        knownTypeNames.has(b)
      );
      const extendsClause =
        baseInterfaces.length > 0 ? ` extends ${baseInterfaces.join(', ')} ` : ' ';

      lines.push(`export interface ${typeDef.name}${extendsClause}{`);
      for (const prop of typeDef.properties) {
        const tsType = mapCsharpTypeToTs(prop.csharpType, knownTypeNames);
        lines.push(`  ${prop.name}: ${tsType};`);
      }
      lines.push('}');
      lines.push('');
      continue;
    }

    if (typeDef.kind === 'class') {
      const basesAll = Array.isArray(typeDef.baseTypes) ? typeDef.baseTypes : [];
      // 仅对“已知的接口/类”保留 implements；避免把未知接口写入 implements 造成编译报错
      const baseTypesKnown = basesAll.filter((b) => knownTypeNames.has(b));

      /**
       *
       * @type {string|null}
       *
       */
      let baseClassName = null;
      /**
       *
       * @type {string[]}
       *
       */
      const interfaceBases = [];

      for (const baseName of baseTypesKnown) {
        const baseTypeDef = typeByName.get(baseName);
        if (baseTypeDef && baseTypeDef.kind === 'class' && !baseClassName) {
          baseClassName = baseName;
        } else {
          interfaceBases.push(baseName);
        }
      }

      // 外部基类回退（例如 C# EmployeeFile : Record），即使 Record 未在本文件生成，也保持 extends 关系
      if (!baseClassName && basesAll.includes('Record')) {
        baseClassName = 'ErpRecord';
      }

      const extendsClause = baseClassName ? ` extends ${baseClassName}` : '';
      const implementsClause =
        interfaceBases.length > 0 ? ` implements ${interfaceBases.join(', ')}` : '';

      lines.push(
        `export class ${typeDef.name}${extendsClause}${implementsClause} {`
      );

      for (const prop of typeDef.properties) {
        const tsType = mapCsharpTypeToTs(prop.csharpType, knownTypeNames);
        lines.push(`  ${prop.name}!: ${tsType};`);
      }

      lines.push('  /**');
      lines.push('   * 初始化所有非空属性的默认值。');
      lines.push('   */');
      lines.push('  initDefaults(): void {');
      if (baseClassName) {
        lines.push('    if (typeof super.initDefaults === "function") {');
        lines.push('      super.initDefaults();');
        lines.push('    }');
      }
      for (const prop of typeDef.properties) {
        const tsType = mapCsharpTypeToTs(prop.csharpType, knownTypeNames);
        const initializer = getDefaultInitializerForProperty(
          prop.csharpType,
          tsType,
          typeByName
        );
        if (initializer) {
          lines.push(
            `    if (this.${prop.name} === undefined || this.${prop.name} === null) {`
          );
          lines.push(`      this.${prop.name} = ${initializer};`);
          lines.push('    }');
        }
      }
      lines.push('  }');
      lines.push('}');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 *
 * 主入口：扫描 ERP.Db 中的实体与枚举，并生成对应的 TS 类型文件。
 *
 */
function main() {
  const erpDbRoot = getErpDbRoot();

  // 需要扫描的子目录：实体、枚举及迭代实体
  const scanDirs = [
    path.join(erpDbRoot, 'EntityFrameworkCore'),
    path.join(erpDbRoot, 'Iterate2024', 'Entities'),
    path.join(erpDbRoot, 'Enums'),
    path.join(erpDbRoot, 'Iterate2024', 'Enums'),
    path.join(erpDbRoot, 'Interfaces'),
    path.join(erpDbRoot, 'Iterate2024', 'Interfaces'),
  ].filter((p) => fs.existsSync(p));

  if (scanDirs.length === 0) {
    console.error('未找到任何需要扫描的 ERP.Db 子目录，请检查路径配置。');
    process.exitCode = 1;
    return;
  }

  /**
   *
   * @type {Map<string, ParsedType>}
   *
   */
  const typeMap = new Map();

  for (const dir of scanDirs) {
    const csFiles = collectCsFiles(dir);
    for (const file of csFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        parseCsFile(content, file, typeMap);
      } catch (error) {
        // 单个文件解析失败不应影响整体生成过程，这里仅输出错误信息。
        console.error(`解析文件失败: ${file}`, error);
      }
    }
  }

  const finalTypes = buildFinalTypes(typeMap);

  const outputPath = path.resolve(__dirname, '../src/types/erp-db.generated.ts');
  ensureDirectory(path.dirname(outputPath));

  const tsSource = generateTsSource(finalTypes);
  fs.writeFileSync(outputPath, tsSource, 'utf8');
}

// 直接执行脚本时才运行 main，方便日后在测试中导入函数。
if (require.main === module) {
  main();
}
