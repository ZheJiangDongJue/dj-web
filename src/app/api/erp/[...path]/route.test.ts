import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('ERP 通用代理路由', () => {
  const originalBaseUrl = process.env.ERP_API_BASE_URL
  const originalPrefix = process.env.ERP_UPSTREAM_PREFIX

  beforeEach(() => {
    process.env.ERP_API_BASE_URL = 'http://127.0.0.1:5099'
    delete process.env.ERP_UPSTREAM_PREFIX
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('{"success":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
    ))
  })

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.ERP_API_BASE_URL
    else process.env.ERP_API_BASE_URL = originalBaseUrl

    if (originalPrefix === undefined) delete process.env.ERP_UPSTREAM_PREFIX
    else process.env.ERP_UPSTREAM_PREFIX = originalPrefix

    vi.unstubAllGlobals()
  })

  it('未配置上游前缀时默认转发到 ERP.WebApi 的 /api 路径', async () => {
    const request = new NextRequest('http://localhost/api/erp/FlowScanApi/CheckDocumentState', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })

    await POST(request, {
      params: Promise.resolve({ path: ['FlowScanApi', 'CheckDocumentState'] }),
    })

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://127.0.0.1:5099/api/FlowScanApi/CheckDocumentState',
    )
  })

  it('客户端路径已包含 /api 时不会向上游重复拼接 /api', async () => {
    const request = new NextRequest('http://localhost/api/erp/api/FlowScanApi/CheckDocumentState', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })

    await POST(request, {
      params: Promise.resolve({ path: ['api', 'FlowScanApi', 'CheckDocumentState'] }),
    })

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://127.0.0.1:5099/api/FlowScanApi/CheckDocumentState',
    )
  })

  it('显式配置空前缀时保留根路径后端的兼容行为', async () => {
    process.env.ERP_UPSTREAM_PREFIX = ''
    const request = new NextRequest('http://localhost/api/erp/Health', { method: 'POST', body: '{}' })

    await POST(request, {
      params: Promise.resolve({ path: ['Health'] }),
    })

    const fetchMock = vi.mocked(fetch)
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://127.0.0.1:5099/Health')
  })
})
