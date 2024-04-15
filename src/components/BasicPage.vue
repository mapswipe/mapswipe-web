<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    pageName: String,
  },
})
</script>

<template>
  <v-container :class="['px-10', 'px-md-5', 'py-5', 'basic-page', pageName]">
    <slot></slot>
  </v-container>
</template>

<style scoped></style>
