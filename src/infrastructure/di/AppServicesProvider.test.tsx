import { describe, it, expect } from 'vitest'
import React, { useContext } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import AppServicesProvider, { AppServicesContext, createServiceToken } from './AppServicesProvider'
import { useService } from './hooks'

describe('AppServicesProvider / useService', () => {
  it('未包裹 Provider 时，useService 抛出明确错误', () => {
    const Token = createServiceToken<string>('TestService')

    function Consumer() {
      const value = useService(Token)
      return <span>{value}</span>
    }

    expect(() => renderToStaticMarkup(<Consumer />)).toThrow('useService 只能在 <AppServicesProvider> 内使用')
  })

  it('已注册 value 时，useService 能正确返回', () => {
    const Token = createServiceToken<string>('TestService')

    function Consumer() {
      const value = useService(Token)
      return <span>{value}</span>
    }

    const html = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, value: 'ok' }]}>
        <Consumer />
      </AppServicesProvider>,
    )

    expect(html).toBe('<span>ok</span>')
  })

  it('服务未注册时抛出包含已注册列表的错误', () => {
    const Wanted = createServiceToken<string>('WantedService')
    const Registered = createServiceToken<number>('RegisteredService')

    function Consumer() {
      const value = useService(Wanted)
      return <span>{value}</span>
    }

    expect(() =>
      renderToStaticMarkup(
        <AppServicesProvider registrations={[{ token: Registered, value: 1 }]}>
          <Consumer />
        </AppServicesProvider>,
      ),
    ).toThrow('服务未注册：WantedService')
  })

  it('支持 factory 注册：只创建一次并缓存实例', () => {
    const Token = createServiceToken<{ id: number }>('FactoryService')

    let created = 0
    const factory = () => {
      created += 1
      return { id: created }
    }

    function Consumer() {
      const a = useService(Token)
      const b = useService(Token)
      return (
        <span>
          {a.id}:{b.id}
        </span>
      )
    }

    const html = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, factory }]}>
        <Consumer />
      </AppServicesProvider>,
    )

    expect(created).toBe(1)
    expect(html).toBe('<span>1:1</span>')
  })

  it('factory 只有在首次请求时才会创建（懒加载）', () => {
    const Token = createServiceToken<{ id: number }>('LazyFactoryService')

    let created = 0
    const factory = () => {
      created += 1
      return { id: created }
    }

    function Noop() {
      return <span>noop</span>
    }

    const html = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, factory }]}>
        <Noop />
      </AppServicesProvider>,
    )

    expect(created).toBe(0)
    expect(html).toBe('<span>noop</span>')
  })

  it('每个 Provider 拥有独立生命周期（不同 Provider 不共享缓存实例）', () => {
    const Token = createServiceToken<{ id: number }>('ScopedFactoryService')

    let created = 0
    const factory = () => {
      created += 1
      return { id: created }
    }

    function Consumer() {
      const value = useService(Token)
      return <span>{value.id}</span>
    }

    const html1 = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, factory }]}>
        <Consumer />
      </AppServicesProvider>,
    )

    const html2 = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, factory }]}>
        <Consumer />
      </AppServicesProvider>,
    )

    expect(created).toBe(2)
    expect(html1).toBe('<span>1</span>')
    expect(html2).toBe('<span>2</span>')
  })

  it('Provider 嵌套时：内层覆盖不影响外层（服务隔离）', () => {
    const Token = createServiceToken<string>('NestedService')

    function Consumer({ label }: { label: string }) {
      const value = useService(Token)
      return (
        <span>
          {label}:{value};
        </span>
      )
    }

    const html = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, value: 'outer' }]}>
        <div>
          <Consumer label="outer" />
          <AppServicesProvider registrations={[{ token: Token, value: 'inner' }]}>
            <Consumer label="inner" />
          </AppServicesProvider>
        </div>
      </AppServicesProvider>,
    )

    expect(html).toBe('<div><span>outer:outer;</span><span>inner:inner;</span></div>')
  })

  it('inheritParent=false（默认）时，子 Provider 不会继承父级服务', () => {
    const Token = createServiceToken<string>('StrictIsolationService')

    function Consumer() {
      const value = useService(Token)
      return <span>{value}</span>
    }

    expect(() =>
      renderToStaticMarkup(
        <AppServicesProvider registrations={[{ token: Token, value: 'parent' }]}>
          <AppServicesProvider>
            <Consumer />
          </AppServicesProvider>
        </AppServicesProvider>,
      ),
    ).toThrow('服务未注册：StrictIsolationService')
  })

  it('inheritParent=true 时，子 Provider 可继承父级服务', () => {
    const Token = createServiceToken<string>('InheritedService')

    function Consumer() {
      const value = useService(Token)
      return <span>{value}</span>
    }

    const html = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: Token, value: 'parent' }]}>
        <AppServicesProvider inheritParent>
          <Consumer />
        </AppServicesProvider>
      </AppServicesProvider>,
    )

    expect(html).toBe('<span>parent</span>')
  })

  it('container.has 能正确反映注册/继承状态', () => {
    const TokenA = createServiceToken<string>('HasServiceA')
    const TokenB = createServiceToken<string>('HasServiceB')

    function Probe() {
      const container = useContext(AppServicesContext)
      if (!container) return <span>no-container</span>
      return (
        <span>
          {String(container.has(TokenA))}:{String(container.has(TokenB))}
        </span>
      )
    }

    const html = renderToStaticMarkup(
      <AppServicesProvider registrations={[{ token: TokenA, value: 'a' }]}>
        <AppServicesProvider inheritParent registrations={[{ token: TokenB, value: 'b' }]}>
          <Probe />
        </AppServicesProvider>
      </AppServicesProvider>,
    )

    expect(html).toBe('<span>true:true</span>')
  })
})
