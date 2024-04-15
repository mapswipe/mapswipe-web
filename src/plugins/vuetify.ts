import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

export const theme = {
  light: {
    primary: import.meta.env.VITE_THEME_LIGHT_PRIMARY,
    secondary: import.meta.env.VITE_THEME_LIGHT_SECONDARY,
    tertiary: import.meta.env.VITE_THEME_LIGHT_TERTIARY,
    accent: import.meta.env.VITE_THEME_LIGHT_ACCENT,
    error: import.meta.env.VITE_THEME_LIGHT_ERROR,
    warning: import.meta.env.VITE_THEME_LIGHT_WARNING,
    info: import.meta.env.VITE_THEME_LIGHT_INFO,
    success: import.meta.env.VITE_THEME_LIGHT_SUCCESS,
    neutral: import.meta.env.VITE_THEME_LIGHT_NEUTRAL,
  },
  dark: {},
}

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        variables: {},
        dark: false,
        colors: theme.light,
      },
      dark: {
        variables: {},
        dark: true,
        colors: theme.dark,
      },
    },
  },
})
