<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    mission: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: false,
    },
  },
})
</script>

<template>
  <v-toolbar color="white" density="compact" tag="div">
    <v-toolbar-title>
      <div class="text-caption">{{ title }}</div>
      <div style="font-size: 1rem">
        <strong>{{ mission }}</strong>
      </div>
    </v-toolbar-title>
    <slot></slot>
  </v-toolbar>
</template>

<style scoped></style>
