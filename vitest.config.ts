import { defineConfig, configDefaults } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'node',
    testTimeout: 5000,
    // Unit tests only. Playwright E2E specs run in a separate workflow.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    coverage: {
      provider: 'istanbul',
      reportsDirectory: './coverage',
      allowExternal: true,
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/lib/api/**',
        'src/lib/auth/**',
        'src/hooks/useAuth.ts',
        'src/application/quality/ncr/**',
        'src/infrastructure/di/**',
      ],
      exclude: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*', 'src/types/erp-db.generated.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
