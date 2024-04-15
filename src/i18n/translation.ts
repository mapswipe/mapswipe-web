import i18n from '@/i18n'
import { nextTick } from 'vue'

const Translation = {
  get defaultLocale() {
    return import.meta.env.VITE_DEFAULT_LOCALE
  },
  get supportedLocales() {
    return import.meta.env.VITE_SUPPORTED_LOCALES.split(',')
  },
  get currentLocale() {
    return i18n.global.locale.value
  },
  set currentLocale(newLocale) {
    i18n.global.locale.value = newLocale
  },
  async switchLanguage(newLocale) {
    await Translation.loadLocaleMessages(newLocale)
    Translation.currentLocale = newLocale
    document.querySelector('html').setAttribute('lang', newLocale)
    localStorage.setItem('user-locale', newLocale)
  },
  async loadLocaleMessages(locale) {
    if (!i18n.global.availableLocales.includes(locale)) {
      const messages = await import(`@/i18n/locales/${locale}.json`)
      i18n.global.setLocaleMessage(locale, messages.default)
    }
    return nextTick()
  },
  getPersistedLocale() {
    const persistedLocale = localStorage.getItem('user-locale')
    if (Translation.isLocaleSupported(persistedLocale)) {
      return persistedLocale
    } else {
      return null
    }
  },
  getUserLocale() {
    const locale =
      window.navigator.language || window.navigator.userLanguage || Translation.defaultLocale
    return {
      locale: locale,
      localeNoRegion: locale.split('-')[0],
    }
  },
  isLocaleSupported(locale) {
    return Translation.supportedLocales.includes(locale)
  },
  guessDefaultLocale() {
    const userPersistedLocale = Translation.getPersistedLocale()
    if (userPersistedLocale) {
      return userPersistedLocale
    }
    const userPreferredLocale = Translation.getUserLocale()
    if (Translation.isLocaleSupported(userPreferredLocale.locale)) {
      return userPreferredLocale.locale
    }
    if (Translation.isLocaleSupported(userPreferredLocale.localeNoRegion)) {
      return userPreferredLocale.localeNoRegion
    }
    return Translation.defaultLocale
  },
  async routeMiddleware(to, _from, next) {
    const paramLocale = to.params.locale
    if (!Translation.isLocaleSupported(paramLocale)) {
      return next(Translation.guessDefaultLocale())
    }
    await Translation.switchLanguage(paramLocale)
    return next()
  },
}

export function i18nRoute(to) {
  return {
    ...to,
    params: {
      locale: Translation.currentLocale,
      ...to.params,
    },
  }
}

export default Translation
