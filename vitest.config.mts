import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.mjs'

export default mergeConfig(
  viteConfig,
  defineConfig({
    esbuild: {
      // Transpile all files with ESBuild to remove comments from code coverage.
      // Required for `test.coverage.ignoreEmptyLines` to work:
      include: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.ts', '**/*.tsx'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/*'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      server: {
        deps: {
          inline: ['vuetify']
        },
      },
    },
  })
)
