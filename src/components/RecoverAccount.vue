<script lang="ts">
import { defineComponent } from 'vue'
import { getAuth, sendPasswordResetEmail, type ActionCodeSettings } from 'firebase/auth'

export default defineComponent({
  data() {
    return {
      isFormValid: false,
      email: '',
      newPassword: null,
      resetToken: null,
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
    },
  },
  inject: {
    showSnackbar: 'showSnackbar',
  },
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },
  },
  methods: {
    requestReset() {
      if (this.isFormValid) {
        const auth = getAuth()
        // workaround: dev instance does not accept continueUrl argument at the moment
        var actionCodeSettings = undefined
        const mode = import.meta.env.MODE
        if (mode === 'production') {
          actionCodeSettings = {
            url: `${location.protocol}//${location.host}/#/${this.currentLocale}/auth/sign-in`,
          } as ActionCodeSettings
        }
        sendPasswordResetEmail(auth, this.email, actionCodeSettings)
          .then(() => this.showSnackbar(this.$t('authView.passwordResetEmailSent'), 'success'))
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
    <v-form v-model="isFormValid" ref="form" @keyup.enter="requestReset">
      <v-col>
        <v-text-field
          v-model="email"
          :label="$t('authView.email') + '*'"
          ref="email"
          :rules="[rules.required, rules.email]"
        />
      </v-col>
      <v-col class="text-right">
        <v-btn :disabled="!isFormValid" color="primary" @click="requestReset">
          {{ $t('authView.recoverAccount') }}
        </v-btn>
      </v-col>
    </v-form>
  </v-container>
</template>

<style scoped></style>
