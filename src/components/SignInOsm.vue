<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      consent: false,
    }
  },
  computed: {
    osmOAuthRedirectUri() {
      const uri = import.meta.env.VITE_OSM_OAUTH_REDIRECT_URI
      return uri
    },
    privacyPolicyUrl() {
      const url = import.meta.env.VITE_PRIVACY_POLICY_URL
      const locale = this.$i18n.locale
      return url.replace('{locale}', locale)
    },
  },
  methods: {
    signInOSM() {
      window.location.href = this.osmOAuthRedirectUri
    },
  },
})
</script>

<template>
  <v-dialog max-width="800">
    <template v-slot:activator="{ props: activatorProps }">
      <v-col v-if="osmOAuthRedirectUri" class="text-center">
        <v-divider />
        <br />
        {{ $t('authView.or') }}
        <br /><br />
        <v-btn color="primary" v-bind="activatorProps" depressed>
          {{ $t('authView.signInOsm') }}
        </v-btn>
      </v-col>
    </template>
    <template v-slot:default>
      <v-card>
        <v-card-text>
          {{ $t('authView.signInOsmText') }}
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
        </v-card-text>
        <v-btn color="primary" @click="signInOSM" :disabled="!consent" depressed>
          {{ $t('authView.signInOsm') }}
        </v-btn>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped></style>
