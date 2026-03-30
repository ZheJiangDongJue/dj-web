import { describe, it, expect } from 'vitest'
import TSLogAdapter from '../../../src/utils/logger/adapters/TSLogAdapter'

describe('TSLogAdapter', () => {
  it('appends context object to last argument when present', () => {
    const calls: any[] = []
    const injected = {
      silly: (...args: any[]) => calls.push(['silly', ...args]),
      trace: (...args: any[]) => calls.push(['trace', ...args]),
      debug: (...args: any[]) => calls.push(['debug', ...args]),
      info: (...args: any[]) => calls.push(['info', ...args]),
      warn: (...args: any[]) => calls.push(['warn', ...args]),
      error: (...args: any[]) => calls.push(['error', ...args]),
      fatal: (...args: any[]) => calls.push(['fatal', ...args]),
      getSubLogger: () => injected,
    }

    const adapter = new TSLogAdapter({ name: 'test', context: { requestId: 'rid' } }, injected as any)
    adapter.info('hello', { a: 1 })
    const last = calls.at(-1)!
    expect(last[0]).toBe('info')
    const tail = last.at(-1)
    expect(tail && typeof tail === 'object' && 'context' in tail).toBe(true)
    expect(tail.context).toEqual({ requestId: 'rid' })
  })
})

