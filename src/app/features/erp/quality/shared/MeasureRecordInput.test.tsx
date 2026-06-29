// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { MeasureRecordInput } from './MeasureRecordInput'

afterEach(() => {
  cleanup()
})

describe('MeasureRecordInput', () => {
  it('保留非数字文本，并在失焦时提交原始输入值', () => {
    const handleChange = vi.fn()
    const { getByLabelText } = render(
      <MeasureRecordInput
        ariaLabel="实测1"
        value=""
        onChange={handleChange}
      />,
    )

    const input = getByLabelText('实测1') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'abc-合格' } })
    expect(input.value).toBe('abc-合格')

    fireEvent.blur(input)
    expect(handleChange).toHaveBeenCalledWith('abc-合格')
  })

  it('双击时在 √ 与 × 之间切换并立即提交', () => {
    const handleChange = vi.fn()
    const { getByLabelText, rerender } = render(
      <MeasureRecordInput
        ariaLabel="实测1"
        value="12.5"
        onChange={handleChange}
      />,
    )

    const input = getByLabelText('实测1') as HTMLInputElement
    fireEvent.doubleClick(input)
    expect(input.value).toBe('√')
    expect(handleChange).toHaveBeenLastCalledWith('√')
    expect(input.dataset.measureRecordMark).toBe('true')

    rerender(
      <MeasureRecordInput
        ariaLabel="实测1"
        value="√"
        onChange={handleChange}
      />,
    )
    fireEvent.doubleClick(input)
    expect(input.value).toBe('×')
    expect(handleChange).toHaveBeenLastCalledWith('×')
  })

  it('双击兼容的 ✓ 值时按合格符号处理并切换为 ×', () => {
    const handleChange = vi.fn()
    const { getByLabelText } = render(
      <MeasureRecordInput
        ariaLabel="实测1"
        value="✓"
        onChange={handleChange}
      />,
    )

    const input = getByLabelText('实测1') as HTMLInputElement
    fireEvent.doubleClick(input)
    expect(input.value).toBe('×')
    expect(handleChange).toHaveBeenLastCalledWith('×')
  })
})
