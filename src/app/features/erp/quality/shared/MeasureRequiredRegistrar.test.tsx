// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createRequiredFieldManager } from '@/lib/validation/requiredFieldManager'
import { MeasureRequiredRegistrar } from './MeasureRequiredRegistrar'

afterEach(() => {
  cleanup()
})

describe('MeasureRequiredRegistrar', () => {
  it('空频率默认放开 1~5 时，只要填写任意一个实测值即可通过校验', () => {
    const manager = createRequiredFieldManager<unknown>()
    const registerRequired = (key: string, registration: any) => manager.register(key, registration)

    const { rerender } = render(
      <MeasureRequiredRegistrar
        rowIndex={0}
        enabledCount={5}
        requireAtLeastOneMeasure
        registerRequired={registerRequired}
        details={[
          {
            MeasuredRecord1: '',
            MeasuredRecord2: '',
            MeasuredRecord3: '',
            MeasuredRecord4: '',
            MeasuredRecord5: '',
          },
        ]}
      />,
    )

    expect(manager.checkEmpty()).toEqual({
      hasEmpty: true,
      firstEmptyKey: 'detail:0:1',
      emptyKeys: ['detail:0:1', 'detail:0:2', 'detail:0:3', 'detail:0:4', 'detail:0:5'],
    })

    rerender(
      <MeasureRequiredRegistrar
        rowIndex={0}
        enabledCount={5}
        requireAtLeastOneMeasure
        registerRequired={registerRequired}
        details={[
          {
            MeasuredRecord1: '',
            MeasuredRecord2: '',
            MeasuredRecord3: '12.34',
            MeasuredRecord4: '',
            MeasuredRecord5: '',
          },
        ]}
      />,
    )

    expect(manager.checkEmpty()).toEqual({
      hasEmpty: false,
      firstEmptyKey: undefined,
      emptyKeys: [],
    })
  })

  it('显式频率启用 1~N 时，仍按每个启用实测项都必填校验', () => {
    const manager = createRequiredFieldManager<unknown>()
    const registerRequired = (key: string, registration: any) => manager.register(key, registration)

    render(
      <MeasureRequiredRegistrar
        rowIndex={0}
        enabledCount={3}
        requireAtLeastOneMeasure={false}
        registerRequired={registerRequired}
        details={[
          {
            MeasuredRecord1: '1.00',
            MeasuredRecord2: '',
            MeasuredRecord3: '',
          },
        ]}
      />,
    )

    expect(manager.checkEmpty()).toEqual({
      hasEmpty: true,
      firstEmptyKey: 'detail:0:2',
      emptyKeys: ['detail:0:2', 'detail:0:3'],
    })
  })

  it('提供稳定 rowKey 时，注册 key 不随 index 复用而残留旧行', () => {
    const manager = createRequiredFieldManager<unknown>()
    const registerRequired = (key: string, registration: any) => manager.register(key, registration)

    const { rerender } = render(
      <MeasureRequiredRegistrar
        rowKey="local_deleted"
        rowIndex={1}
        enabledCount={1}
        requireAtLeastOneMeasure={false}
        registerRequired={registerRequired}
        details={[{}, { MeasuredRecord1: '' }]}
      />,
    )

    expect(manager.keys()).toEqual(['detail:local_deleted:1:1'])

    rerender(
      <MeasureRequiredRegistrar
        rowKey="local_kept"
        rowIndex={1}
        enabledCount={1}
        requireAtLeastOneMeasure={false}
        registerRequired={registerRequired}
        details={[{}, { MeasuredRecord1: 'ok' }]}
      />,
    )

    expect(manager.keys()).toEqual(['detail:local_kept:1:1'])
    expect(manager.checkEmpty()).toEqual({
      hasEmpty: false,
      firstEmptyKey: undefined,
      emptyKeys: [],
    })
  })
})
