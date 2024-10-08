<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  emits: ['onStartMappingClick']
});
</script>
<template>
  <v-card class="tutorial-completion-card" flat>
    <v-icon
      color="green"
      size="72"
    >
      mdi-check-circle
    </v-icon>
    <v-card-title>
      You're ready to start MapSwiping!
    </v-card-title>
    <v-card-text class="tutorial-completion-description">
      You're now equipped with all you need to contribute to humanitarian mapping using the app. You can come back anytime for refresher.
    </v-card-text>
    <v-btn @click="$emit('onStartMappingClick')">
      Start mapping
    </v-btn>
  </v-card>
</template>
<style scoped>
.tutorial-completion-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: max(calc(70vh - 375px), 300px);
}

.tutorial-completion-description {
  text-align: center;
  max-width: 24rem;
  flex-grow: unset;
}
</style>
