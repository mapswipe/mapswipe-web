<script lang="ts">
import { defineComponent } from 'vue'
import { i18nRoute } from '@/i18n/translation'
import { signInWithCustomToken, getAuth } from 'firebase/auth'
import { logAnalyticsEvent } from '@/firebase'

export default defineComponent({
  props: {
    token: String,
  },
  inject: {
    showSnackbar: 'showSnackbar',
  },
  methods: {
    i18nRoute,
    signin(token: String) {
      const routerReplace = this.$router.replace
      const auth = getAuth()
      signInWithCustomToken(auth, token)
        .then(() => {
          this.showSnackbar(this.$t('authView.osmSignInSuccess'), 'success')
          logAnalyticsEvent('account_login')
          routerReplace(i18nRoute({ name: 'projects' }))
        })
        .catch(() => {
          this.showSnackbar(this.$t('authView.osmSignInError'), 'error')
          routerReplace(i18nRoute({ name: 'authentication', params: { authTab: 'sign-in' } }))
        })
    },
  },
  mounted() {
    this.signin(this.token)
  },
})
</script>

<template>
  <p></p>
</template>
