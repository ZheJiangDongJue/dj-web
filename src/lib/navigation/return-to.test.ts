import { describe, expect, test, vi, afterEach } from 'vitest'
import {
  buildQualityInspectionActionHref,
  buildQualityInspectionReturnTo,
  getCurrentInternalHref,
  normalizeInternalReturnTo,
  normalizeQualityInspectionSource,
} from './return-to'

afterEach(() => {
  delete (globalThis as unknown as { window?: Window }).window
  vi.restoreAllMocks()
})

describe('navigation return-to helpers', () => {
  test('normalizeQualityInspectionSource 只接受 FAI/FQC 来源', () => {
    expect(normalizeQualityInspectionSource('FAI')).toBe('fai')
    expect(normalizeQualityInspectionSource(' fqc ')).toBe('fqc')
    expect(normalizeQualityInspectionSource('ncr')).toBeNull()
    expect(normalizeQualityInspectionSource(undefined)).toBeNull()
  })

  test('buildQualityInspectionReturnTo 构建可恢复单据的返回地址', () => {
    expect(buildQualityInspectionReturnTo('fqc', 12)).toBe('/features/erp/quality/fqc?id=12')
    expect(buildQualityInspectionReturnTo('fai', '8')).toBe('/features/erp/quality/fai?id=8')
    expect(buildQualityInspectionReturnTo('fai', 'abc')).toBe('/features/erp/quality/fai')
    expect(buildQualityInspectionReturnTo('ncr', 1)).toBeNull()
  })

  test('buildQualityInspectionActionHref 构建质量检验动作回跳地址', () => {
    expect(buildQualityInspectionActionHref('fai', 'unapprove')).toBe(
      '/features/erp/quality/fai?action=unapprove',
    )
    expect(buildQualityInspectionActionHref('fqc', 'unapprove', 12)).toBeNull()
    expect(buildQualityInspectionActionHref('ncr', 'unapprove', 12)).toBeNull()
    expect(buildQualityInspectionActionHref('fqc', '', 12)).toBeNull()
  })

  test('normalizeInternalReturnTo 接受站内路径并保留查询与 hash', () => {
    expect(normalizeInternalReturnTo('/features/erp/quality/fqc?id=12#top')).toBe(
      '/features/erp/quality/fqc?id=12#top',
    )
    expect(normalizeInternalReturnTo('features/erp/quality/fqc?id=12')).toBe(
      '/features/erp/quality/fqc?id=12',
    )
  })

  test('normalizeInternalReturnTo 拒绝跨域、协议、反斜杠与自身路径', () => {
    expect(normalizeInternalReturnTo('https://evil.test/phish')).toBeNull()
    expect(normalizeInternalReturnTo('//evil.test/phish')).toBeNull()
    expect(normalizeInternalReturnTo('javascript:alert(1)')).toBeNull()
    expect(normalizeInternalReturnTo('/features\\evil')).toBeNull()
    expect(
      normalizeInternalReturnTo(
        '/features/erp/quality/ncr?from=fqc',
        '/features/erp/quality/ncr?from=fqc#ignored',
      ),
    ).toBeNull()
  })

  test('getCurrentInternalHref 从浏览器地址读取站内返回地址', () => {
    ;(globalThis as unknown as { window: Pick<Window, 'location'> }).window = {
      location: {
        pathname: '/features/erp/quality/fqc',
        search: '?id=12',
        hash: '#top',
      } as Location,
    }

    expect(getCurrentInternalHref()).toBe('/features/erp/quality/fqc?id=12#top')
  })
})
