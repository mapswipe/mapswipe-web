<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    progress: {
      type: Number,
      require: true,
    },
    total: {
      type: Number,
      require: true,
    },
  },
})
</script>

<template>
  <v-progress-linear :model-value="progress" :max="total" color="success" height="10" />
</template>

<style scoped></style>
