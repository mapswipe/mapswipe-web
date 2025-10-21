import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { ValidateEnv } from '@togglecorp/vite-plugin-validate-env';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    ValidateEnv(),
    vue({
      template: {
        compilerOptions: {
          // Treat pnx-* as custom elements (prevents warnings)
          isCustomElement: (tag) => tag.startsWith('pnx-')
        }
      }
    }),
    vueJsx(),
    VueI18nPlugin({
      runtimeOnly: false,
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/locales/**'),
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
