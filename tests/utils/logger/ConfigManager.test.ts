import { describe, it, expect } from 'vitest'
import ConfigManager from '../../../src/utils/logger/config/ConfigManager'

describe('ConfigManager', () => {
  it('parses environment variables with LOG_ prefix', () => {
    const cfg = ConfigManager.resolve({
      env: {
        LOG_LEVEL: 'DEBUG',
        LOG_TYPE: 'json',
        LOG_ADAPTER: 'console',
        LOG_OUTPUT_CONSOLE: 'false',
        LOG_OUTPUT_FILE_PATH: 'logs/app.log',
        LOG_OUTPUT_FILE_MAX_SIZE: '10m',
        LOG_OUTPUT_FILE_MAX_FILES: '5',
        LOG_FORMATTING_TIMESTAMP: 'true',
        LOG_FORMATTING_COLORIZE: 'false',
        LOG_FORMATTING_TEMPLATE: '[{level}] {message}',
        LOG_MASK_ENABLED: 'true',
        LOG_MASK_PATTERNS: 'password,token',
        LOG_MASK_REPLACEMENT: '***',
      },
    })

    expect(cfg.type).toBe('json')
    expect(cfg.adapter).toBe('console')
    expect(cfg.output.console).toBe(false)
    expect(cfg.output.file?.path).toBe('logs/app.log')
    expect(cfg.output.file?.maxSize).toBe('10m')
    expect(cfg.output.file?.maxFiles).toBe(5)
    expect(cfg.formatting.timestamp).toBe(true)
    expect(cfg.formatting.colorize).toBe(false)
    expect(cfg.formatting.template).toBe('[{level}] {message}')
    expect(cfg.mask.enabled).toBe(true)
    expect(cfg.mask.patterns).toEqual(['password', 'token'])
    expect(cfg.mask.replacement).toBe('***')
  })
})

