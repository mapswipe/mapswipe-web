<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    url: {
      type: String,
      required: true,
    },
    urlB: {
      type: String,
      require: false,
    },
    spinner: {
      type: Boolean,
      default: false,
    },
    opacity: {
      type: Number,
      default: 1,
    },
    opacityB: {
      type: Number,
      default: 1,
    },
    maxSize: {
      type: String,
      require: false,
    },
  },
})
</script>

<template>
  <v-img
    :src="url"
    aspect-ratio="1"
    :style="'opacity: ' + opacity"
    :max-height="maxSize"
    :max-width="maxSize"
  >
    <template v-if="spinner" v-slot:placeholder>
      <v-row class="fill-height ma-0" align="center" justify="center">
        <v-progress-circular color="primary" indeterminate />
      </v-row>
    </template>
    <image-tile v-if="urlB" :url="urlB" :spinner="spinner" :opacity="opacityB" />
  </v-img>
</template>

<style scoped></style>
