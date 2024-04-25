<script lang="ts">
import { defineComponent } from 'vue'
import { i18nRoute } from '@/i18n/translation'
import { mapStores } from 'pinia'
import { useCurrentUserStore } from '@/stores/currentUser'

export default defineComponent({
  methods: {
    i18nRoute,
  },
  computed: {
    ...mapStores(useCurrentUserStore),
    user() {
      return this.currentUserStore.currentUser
    },
    isVerified() {
      return this.currentUserStore.currentUser?.emailVerified
    },
    allowUnverifiedUsers() {
      const allow = import.meta.env.VITE_ALLOW_UNVERIFIED_USERS
      return allow
    },
  },
})
</script>

<template>
  <v-banner v-if="user && !isVerified && !allowUnverifiedUsers" bg-color="accent" density="compact">
    <v-banner-text>
      <h4>{{ $t('appBanner.title') }}</h4>
      <p>{{ $t('appBanner.message') }}</p>
    </v-banner-text>
    <template #actions>
      <v-btn
        v-if="$route.name != 'RequestPasswordReset'"
        :to="i18nRoute({ name: 'authentication', params: { authTab: 'recover-account' } })"
        color="secondary"
        variant="text"
      >
        {{ $t('appBanner.recover') }}
      </v-btn>
    </template>
  </v-banner>
</template>

<style scoped></style>
