import { describe, it, expect } from 'vitest'

import { DIALOG_CONTENT_CLASSNAME_FULLSCREEN } from './dialog.styles'

describe('DialogContent fullscreen variant', () => {
  it('不包含居中 translate/zoom，避免全屏内容偏移到左上角', () => {
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).toContain('inset-0')
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).toContain('w-screen')
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).toContain('h-screen')

    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).not.toContain('top-[50%]')
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).not.toContain('left-[50%]')
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).not.toContain('-translate-x-1/2')
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).not.toContain('-translate-y-1/2')

    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).not.toContain('zoom-in')
    expect(DIALOG_CONTENT_CLASSNAME_FULLSCREEN).not.toContain('zoom-out')
  })
})

