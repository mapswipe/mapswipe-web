<script lang="ts">
import { defineComponent } from 'vue'
import {
  type ActionCodeSettings,
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'
import { logAnalyticsEvent } from '@/firebase'
import { i18nRoute } from '@/i18n/translation'

export default defineComponent({
  data() {
    return {
      isFormValid: false,
      displayName: '',
      password: '',
      confirmPassword: '',
      email: '',
      showPassword: false,
      consent: false,
      rules: {
        min4: (v) => v.length >= 4 || this.$t('authView.minChar', { number: '4' }),
        min6: (v) => v.length >= 6 || this.$t('authView.minChar', { number: '6' }),
        passwordMatch: () =>
          this.password === this.confirmPassword || this.$t('authView.passwordMatch'),
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
      this.$refs.displayName.validate()
      this.$refs.password.validate()
      this.$refs.confirmPassword.validate()
    },
  },
  inject: {
    showSnackbar: 'showSnackbar',
  },
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },
    privacyPolicyUrl() {
      const url = import.meta.env.VITE_PRIVACY_POLICY_URL
      const locale = this.$i18n.locale
      return url.replace('{locale}', locale)
    },
  },
  methods: {
    signup() {
      if (this.isFormValid && this.consent) {
        const auth = getAuth()
        const db = getDatabase()

        createUserWithEmailAndPassword(auth, this.email, this.password)
          .then((userCredential) => {
            const user = userCredential.user
            const userId = user.uid

            // workaround: dev instance does not accept continueUrl argument at the moment
            var actionCodeSettings = undefined
            const mode = import.meta.env.MODE
            if (mode === 'production') {
              actionCodeSettings = {
                url: `${location.protocol}//${location.host}/#/${this.currentLocale}/auth/sign-in`,
              } as ActionCodeSettings
            }

            return Promise.all([
              sendEmailVerification(user, actionCodeSettings),
              updateProfile(user, { displayName: this.displayName }),
              set(ref(db, `/v2/users/${userId}/created`), new Date().toISOString()),
              set(ref(db, `/v2/users/${userId}/groupContributionCount`), 0),
              set(ref(db, `/v2/users/${userId}/projectContributionCount`), 0),
              set(ref(db, `/v2/users/${userId}/taskContributionCount`), 0),
              set(ref(db, `/v2/users/${userId}/taskContributionCount`), this.displayName),
            ])
          })
          .then(() => {
            logAnalyticsEvent('account_created')
            this.$router.push(
              i18nRoute({ name: 'authentication', params: { authTab: 'recover-account' } }),
            )
            this.showSnackbar(this.$t('authView.followInstructionOnYourEmail'), 'info')
          })
          .catch((error) => {
            console.log(error)
            const errorMsg = this.$te(`authView.authErrors.${error.code}`)
              ? this.$t(`authView.authErrors.${error.code}`)
              : this.$t(`authView.signUpFailed`)
            this.showSnackbar(errorMsg, 'error')
          })
      }
    },
  },
})
</script>

<template>
  <v-container>
    <v-form v-model="isFormValid" ref="form" @keyup.enter="signup">
      <v-col>
        <v-text-field
          v-model="email"
          :label="$t('authView.email') + '*'"
          ref="email"
          :rules="[rules.required, rules.email]"
        />
        <v-text-field
          v-model="displayName"
          :label="$t('authView.displayName') + '*'"
          ref="displayName"
          :rules="[rules.required, rules.min4]"
        />
        <v-text-field
          v-model="password"
          :label="$t('authView.password') + '*'"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required, rules.min6]"
          ref="password"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-text-field
          v-model="confirmPassword"
          :label="$t('authView.confirmPassword') + '*'"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required, rules.min6, rules.passwordMatch]"
          ref="confirmPassword"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-switch v-model="consent" color="primary" inset>
          <template v-slot:label>
            <i18n-t v-if="privacyPolicyUrl" keypath="authView.consent" scope="global" tag="p">
              <template v-slot:action>
                <a target="blank" :href="privacyPolicyUrl" @click.stop>
                  {{ $t('authView.privacyPolicy') }}
                </a>
              </template>
              <template v-slot:newline><br /></template>
            </i18n-t>
          </template>
        </v-switch>
        <v-col class="text-left">
          {{ $t('authView.consentSubtitle') }}
        </v-col>
      </v-col>
      <v-col class="text-right">
        <v-btn :disabled="!isFormValid || !consent" @click="signup" color="primary">
          {{ $t('authView.signUp') }}
        </v-btn>
      </v-col>
    </v-form>
  </v-container>
</template>

<style scoped></style>
