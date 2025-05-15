<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { signInWithCustomToken, getAuth } from 'firebase/auth'
import { logAnalyticsEvent } from '@/firebase'

// TODO: rewrite in Options API for consistency

const route = useRoute()
console.log('Route:', route)

function signin(token) {
  console.log(token)
  if (token) {
    const auth = getAuth()
    signInWithCustomToken(auth, token)
      .then((userCredential) => {
        const user = userCredential.user
        // TODO: get allowUnverifiedUsers from env
        if (user.emailVerified || this.allowUnverifiedUsers) {
          // TODO: import i18nRoute and make routerPush work
          routerPush(i18nRoute({ name: 'projects' }))
        } else {
          routerPush(
            i18nRoute({
              name: 'authentication',
              params: { authTab: 'recover-account' },
            }),
          )
        }
        logAnalyticsEvent('account_login')
      })
      .catch((error) => {
        // TODO: error handling
        console.log(error)
      })
  }
}

onMounted(() => {
  signin(route.query.token)
})
</script>

<template>
  <p>Testing return from Firebase</p>
</template>
