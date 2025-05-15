<script lang="ts">
import { defineComponent } from 'vue'
import { i18nRoute } from '@/i18n/translation'
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'
import { logAnalyticsEvent } from '@/firebase'

export default defineComponent({
  data() {
    return {
      isFormValid: false,
      email: '',
      password: '',
      showPassword: false,
      authInfo: {
        // oauthHost: 'http://localhost:5173',
        oauthHost: 'https://dev-auth.mapswipe.org',
      },
      rules: {
        required: (value) => !!value || this.$t('authView.required'),
        email: (v) => {
          const pattern =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(v) || this.$t('authView.invalidEmail')
        },
      },
    }
  },
  watch: {
    // Trigger translation of validation error message on text fields
    '$i18n.locale'() {
      this.$refs.email.validate()
      this.$refs.password.validate()
    },
  },
  inject: {
    showSnackbar: 'showSnackbar',
  },
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },
    allowUnverifiedUsers() {
      const allow = import.meta.env.VITE_ALLOW_UNVERIFIED_USERS
      return allow
    },
  },
  methods: {
    i18nRoute,
    signInOSM() {
      // this.$router.push(i18nRoute({ name: 'osm-login' }))
      window.location.href = `${this.authInfo.oauthHost}/redirectweb`
    },
    signin() {
      if (this.isFormValid) {
        const routerPush = this.$router.push
        const auth = getAuth()
        signInWithEmailAndPassword(auth, this.email, this.password)
          .then((userCredential) => {
            const user = userCredential.user
            if (user.emailVerified || this.allowUnverifiedUsers) {
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
            const errorMsg = this.$te(`authView.authErrors.${error.code}`)
              ? this.$t(`authView.authErrors.${error.code}`)
              : this.$t(`authView.authErrors.genericError`)
            this.showSnackbar(errorMsg, 'error')
          })
      }
    },
  },
})
</script>

<template>
  <v-container>
    <v-form v-model="isFormValid" ref="form" @keyup.enter="signin">
      <v-col>
        <v-text-field
          v-model="email"
          :label="$t('authView.email') + '*'"
          ref="email"
          :rules="[rules.required, rules.email]"
          type="email"
          placeholder="email"
          autocomplete="email"
        />
        <v-text-field
          v-model="password"
          :label="$t('authView.password') + '*'"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          placeholder="password"
          autocomplete="password"
          ref="password"
          :rules="[rules.required]"
          @click:append-inner="showPassword = !showPassword"
        />
      </v-col>
      <v-col class="text-right">
        <v-btn :disabled="!isFormValid" color="primary" @click="signin" depressed right>
          {{ $t('authView.signIn') }}
        </v-btn>
        <div class="mt-5">
          <router-link
            :to="
              i18nRoute({
                name: 'authentication',
                params: { authTab: 'recover-account' },
              })
            "
          >
            {{ $t('authView.forgotPassword') }}
          </router-link>
          <br />
          <router-link :to="i18nRoute({ name: 'authentication', params: { authTab: 'sign-up' } })">
            {{ $t('authView.noAccountYet') }}
          </router-link>
        </div>
      </v-col>
      <v-col class="text-center">
        <v-btn color="primary" @click="signInOSM" depressed>
          {{ $t('authView.signInOSM') }}
        </v-btn>
      </v-col>
    </v-form>
  </v-container>
</template>

<style scoped></style>
