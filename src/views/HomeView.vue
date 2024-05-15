<script setup lang="ts">
import BasicPage from '@/components/BasicPage.vue'
import { i18nRoute } from '@/i18n/translation'
</script>

<template>
  <basic-page page-name="home">
    <h1>{{ $t('homeView.title') }}</h1>
    <br />
    <i18n-t keypath="homeView.text" tag="p" scope="global">
      <template v-slot:mapswipeLink>
        <a href="https://mapswipe.org/en/index.html" target="_blank">MapSwipe</a>
      </template>
      <template v-slot:mobileAppLink>
        <a href="https://mapswipe.org/en/index.html" target="_blank">{{
          $t('homeView.mobileApp')
        }}</a>
      </template>
    </i18n-t>
    <v-btn
      class="mt-6"
      color="primary"
      :text="$t('homeView.startMapping')"
      :to="i18nRoute({ name: 'projects' })"
    />
    <v-divider class="mt-6" />
    <br />
    <i18n-t keypath="homeView.acknowledgement" tag="p" scope="global">
      <template v-slot:issueLink>
        <a href="https://github.com/mapswipe/mapswipe-web/issues" target="_blank">{{
          $t('homeView.openAnIssue')
        }}</a>
      </template>
      <template v-slot:heigitLink>
        <a href="https://heigit.org" target="_blank">HeiGIT</a>
      </template>
      <template v-slot:hotLink>
        <a href="https://www.hotosm.org" target="_blank">Humanitarian OpenStreetMap Team</a>
      </template>
    </i18n-t>
  </basic-page>
</template>
