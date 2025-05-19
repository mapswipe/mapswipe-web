<script lang="ts">
import { defineComponent } from 'vue'
import { i18nRoute } from '@/i18n/translation'
import { signInWithCustomToken, getAuth } from 'firebase/auth'
import { logAnalyticsEvent } from '@/firebase'

export default defineComponent({
  inject: {
    showSnackbar: 'showSnackbar',
  },
  methods: {
    i18nRoute,
    signin(token) {
      const routerPush = this.$router.push
      const auth = getAuth()
      signInWithCustomToken(auth, token)
        .then(() => {
          this.showSnackbar(this.$t('authView.osmSignInSuccess'), 'success')
          logAnalyticsEvent('account_login')
          routerPush(i18nRoute({ name: 'projects' }))
        })
        .catch(() => {
          this.showSnackbar(this.$t('authView.osmSignInError'), 'error')
          routerPush(i18nRoute({ name: 'authentication', params: { authTab: 'sign-in' } }))
        })
    },
  },
  // before enter?
  mounted() {
    this.signin(this.$route.query.token)
  },
})
</script>

<template>
  <p></p>
</template>
