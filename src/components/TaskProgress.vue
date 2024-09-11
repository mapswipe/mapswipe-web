<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    progress: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },
})
</script>

<template>
  <v-progress-linear :model-value="progress" :max="total" color="success" height="10" />
</template>

<style scoped></style>
