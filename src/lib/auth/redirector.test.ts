import { describe, it, expect, vi, afterEach } from 'vitest'

const ENV_KEYS = [
  'NEXT_PUBLIC_APP_ERP_BASE_URL',
  'NEXT_PUBLIC_APP_OA_BASE_URL',
  'NEXT_PUBLIC_APP_BI_BASE_URL',
] as const

const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]])) as Record<(typeof ENV_KEYS)[number], string | undefined>

function setWindowLocation(origin: string, assign?: (url: string) => void) {
  ;(globalThis as any).window = {
    location: {
      origin,
      assign: assign ?? vi.fn(),
    },
  }
}

afterEach(() => {
  for (const k of ENV_KEYS) {
    const v = ORIGINAL_ENV[k]
    if (typeof v === 'undefined') delete process.env[k]
    else process.env[k] = v
  }
  delete (globalThis as any).window
  vi.resetModules()
})

describe('redirector', () => {
  it('resolveTarget prefers app base URL when provided (absolute)', async () => {
    process.env.NEXT_PUBLIC_APP_ERP_BASE_URL = 'https://erp.example.com'
    setWindowLocation('https://host.test')

    const { resolveTarget } = await import('./redirector')
    expect(resolveTarget('erp').toString()).toBe('https://erp.example.com/')
  })

  it('resolveTarget supports relative base URL using current origin', async () => {
    process.env.NEXT_PUBLIC_APP_ERP_BASE_URL = '/erp'
    setWindowLocation('https://host.test')

    const { resolveTarget } = await import('./redirector')
    expect(resolveTarget('erp').toString()).toBe('https://host.test/erp')
  })

  it('resolveTarget falls back to same-origin root when base is invalid', async () => {
    process.env.NEXT_PUBLIC_APP_ERP_BASE_URL = 'http://%zz'
    setWindowLocation('https://host.test')

    const { resolveTarget } = await import('./redirector')
    expect(resolveTarget('erp').toString()).toBe('https://host.test/')
  })

  it('resolveTarget falls back to about:blank outside browser', async () => {
    delete (globalThis as any).window
    delete process.env.NEXT_PUBLIC_APP_ERP_BASE_URL

    const { resolveTarget } = await import('./redirector')
    expect(resolveTarget('erp').toString()).toBe('about:blank')
  })

  it('redirect blocks open redirects to a different origin', async () => {
    setWindowLocation('https://host.test')

    const { redirect } = await import('./redirector')
    expect(() => redirect(new URL('https://evil.test/phish'))).toThrow('OPEN_REDIRECT_BLOCKED')
  })

  it('redirect allows same-origin URLs and calls window.location.assign', async () => {
    const assign = vi.fn()
    setWindowLocation('https://host.test', assign)

    const { redirect } = await import('./redirector')
    redirect(new URL('https://host.test/erp'))
    expect(assign).toHaveBeenCalledWith('https://host.test/erp')
  })

  it('redirect allows target URL under app base prefix', async () => {
    process.env.NEXT_PUBLIC_APP_ERP_BASE_URL = 'https://erp.example.com/'
    const assign = vi.fn()
    setWindowLocation('https://host.test', assign)

    const { redirect } = await import('./redirector')
    redirect(new URL('https://erp.example.com/dashboard'))
    expect(assign).toHaveBeenCalledWith('https://erp.example.com/dashboard')
  })

  it('redirect blocks non-http(s) protocols', async () => {
    setWindowLocation('https://host.test')

    const { redirect } = await import('./redirector')
    expect(() => redirect(new URL('javascript:alert(1)'))).toThrow('OPEN_REDIRECT_BLOCKED')
  })

  it('redirect ignores assign errors (browser)', async () => {
    process.env.NEXT_PUBLIC_APP_ERP_BASE_URL = 'https://erp.example.com/'
    setWindowLocation('https://host.test', () => {
      throw new Error('nope')
    })

    const { redirect } = await import('./redirector')
    expect(() => redirect(new URL('https://erp.example.com/'))).not.toThrow()
  })

  it('redirect is a no-op outside browser when target is allowed by env base', async () => {
    delete (globalThis as any).window
    process.env.NEXT_PUBLIC_APP_ERP_BASE_URL = 'https://erp.example.com/'

    const { redirect } = await import('./redirector')
    expect(() => redirect(new URL('https://erp.example.com/'))).not.toThrow()
  })
})
