<script lang="ts">
import { defineComponent } from 'vue'
import UserState from '@/components/UserState.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { i18nRoute } from '@/i18n/translation'

export default defineComponent({
  components: {
    userState: UserState,
    languageSwitcher: LanguageSwitcher,
  },
  data() {
    return {
      menuItems: [
        {
          href: '/projects',
          icon: 'mdi-link',
          name: 'projects',
        },
      ],
      drawer: false,
    }
  },
  computed: {
    logoSrc() {
      const logo = import.meta.env.VITE_APP_LOGO
      return logo
    },
    logoAlt() {
      const alt = import.meta.env.VITE_APP_NAME
      return alt
    },
  },
  methods: {
    i18nRoute,
  },
})
</script>

<template>
  <v-app-bar color="secondary" flat>
    <v-app-bar-nav-icon
      class="hidden-md-and-up"
      @click.stop="drawer = !drawer"
    ></v-app-bar-nav-icon>
    <v-app-bar-title>
      <router-link to="/">
        <v-img height="50" position="left center" :src="logoSrc" :alt="logoAlt" />
      </router-link>
    </v-app-bar-title>
    <v-spacer />
    <v-toolbar-items>
      <template v-for="(item, index) in menuItems" :key="index">
        <v-btn :to="i18nRoute({ name: item.name })" class="hidden-sm-and-down" variant="text" large>
          {{ $t('appHeader.' + item.name) }}
        </v-btn>
      </template>
      <language-switcher />
      <user-state />
    </v-toolbar-items>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" temporary>
    <v-list v-for="(item, index) in menuItems" :key="index" density="compact" nav>
      <v-list-item
        :prepend-icon="item.icon"
        :title="$t('appHeader.' + item.name)"
        :to="i18nRoute({ name: item.name })"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped></style>
