<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
    appName() {
      const name = import.meta.env.VITE_APP_NAME
      return name
    },
    appAttributionTitle() {
      const appAttributionTitle = import.meta.env.VITE_APP_ATTRIBUTION_TITLE
      return appAttributionTitle
    },
    appAttributionUrl() {
      const appAttributionUrl = import.meta.env.VITE_APP_ATTRIBUTION_URL
      return appAttributionUrl
    },
    appWebsiteUrl() {
      const appWebsiteUrl = import.meta.env.VITE_APP_WEBSITE_URL
      return appWebsiteUrl
    },
    imprintUrl() {
      const url = import.meta.env.VITE_IMPRINT_URL
      return url
    },
    privacyPolicyUrl() {
      const url = import.meta.env.VITE_PRIVACY_POLICY_URL
      const locale = this.$i18n.locale
      return url.replace('{locale}', locale)
    },
  },
})
</script>

<template>
  <v-footer class="py-2 py-md-6" color="neutral" app>
    <p class="text-center m-auto">
      <span>
        © {{ currentYear }}
        <strong>
          <a target="_blank" :title="appName" :href="appWebsiteUrl">
            {{ appName }}
          </a>
        </strong>
      </span>
      <span v-if="appAttributionTitle">
        |
        <strong>
          <a target="_blank" :title="appAttributionTitle" :href="appAttributionUrl">
            {{ appAttributionTitle }}
          </a>
        </strong>
      </span>
      &nbsp; &nbsp;
      <span>
        <strong>
          <a
            class="link"
            :title="$t('appFooter.privacyPolicy')"
            :href="privacyPolicyUrl"
            target="_blank"
          >
            {{ $t('appFooter.privacyPolicy') }}
          </a>
        </strong>
        &nbsp; &nbsp;
        <strong>
          <a
            v-if="imprintUrl"
            class="link"
            :title="$t('appFooter.imprint')"
            :href="imprintUrl"
            target="_blank"
          >
            {{ $t('appFooter.imprint') }}
          </a>
        </strong>
      </span>
    </p>
  </v-footer>
</template>

<style scoped>
footer p {
  color: #cbcbcb;
  margin: auto;
}
footer a {
  color: #cbcbcb;
  text-decoration: none;
}
</style>
