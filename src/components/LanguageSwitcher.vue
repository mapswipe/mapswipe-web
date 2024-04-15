<script lang="ts">
import { defineComponent } from 'vue'
import Tr from '@/i18n/translation'

export default defineComponent({
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },
    supportedLocales() {
      const supportedLocales = Tr.supportedLocales
      return supportedLocales
    },
  },
  methods: {
    async switchLanguage(locale: String) {
      await Tr.switchLanguage(locale)

      try {
        await this.$router.replace({ params: { locale: locale } })
      } catch (e) {
        this.$router.push('/')
      }
    },
  },
})
</script>

<template>
  <v-menu v-if="supportedLocales.length > 1">
    <template v-slot:activator="{ props }">
      <v-btn
        icon="mdi-translate"
        v-bind="props"
        :title="$t('languageSwitcher.switchLanguage')"
      ></v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="(locale, index) in supportedLocales"
        :key="index"
        :active="locale == currentLocale"
        @click="switchLanguage(locale)"
      >
        <v-list-item-title>{{ locale }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped></style>
