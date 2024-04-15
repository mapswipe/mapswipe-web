<script lang="ts">
import { defineComponent } from 'vue'
import { i18nRoute } from '@/i18n/translation'
import { mapStores } from 'pinia'
import { useCurrentUserStore } from '@/stores/currentUser'

export default defineComponent({
  computed: {
    ...mapStores(useCurrentUserStore),
    initials() {
      if (!this.user) {
        return ''
      }
      let name = this.user.displayName || this.user.email
      let initials = name.charAt(0)
      if (name.indexOf(' ') > -1) {
        initials += name.split(' ')[1].charAt(0)
      }
      return initials.toUpperCase()
    },
    user() {
      const user = this.currentUserStore.currentUser
      return user
    },
  },
  methods: {
    i18nRoute,
  },
})
</script>

<template>
  <div class="mx-2">
    <v-avatar v-if="user" color="white" size="48" class="mt-2" position="left center">
      <v-btn color="secondary" :title="user.displayName" :to="i18nRoute({ name: 'profile' })" icon>
        {{ initials }}
      </v-btn>
    </v-avatar>
    <v-avatar v-else color="" size="48" class="mt-2">
      <v-btn
        :title="$t('userState.signInSignUp')"
        :to="i18nRoute({ name: 'authentication' })"
        icon="mdi-account-box"
        color="white"
        size="x-large"
      />
    </v-avatar>
  </div>
</template>

<style scoped></style>
