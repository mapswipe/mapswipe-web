<script setup lang="ts">
import BasicPage from '@/components/BasicPage.vue'
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
      <template v-slot:heigitLink>
        <a href="https://heigit.org/geoinformation-for-humanitarian-aid/" target="_blank"
          >Heidelberg Institute for Geoinformation Technology</a
        >
      </template>
      <template v-slot:newline><br /></template>
    </i18n-t>
    <br />
    <p>
      <i>{{ $t('homeView.betaText') }}</i>
    </p>
    <br />
  </basic-page>
</template>
