<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    url: {
      type: String,
    },
    urlB: {
      type: String,
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
    },
  },
})
</script>

<template>
  <v-img
    v-if="url"
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
    <template v-slot:error>
      <v-row class="fill-height ma-0 image-failed" align="center" justify="center">
        {{ $t('imageTile.failureMessage') }}
      </v-row>
    </template>
    <image-tile v-if="!!urlB" :url="urlB" :spinner="spinner" :opacity="opacityB" />
  </v-img>
  <div class="image-not-available" v-if="!url">
    {{ $t('imageTile.notAvailableMessage') }}
  </div>
</template>

<style scoped>
.image-not-available {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  aspect-ratio: 1;
  background-color: #a1a1a1;
  color: rgba(255, 255, 255, 0.6);
}
.image-failed {
  color: rgba(255, 255, 255, 0.6);
  background-color: #a1a1a1;
}
</style>
