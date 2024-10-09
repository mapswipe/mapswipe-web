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
      {{ $t('projectTutorial.completionTitle') }}
    </v-card-title>
    <v-card-text class="tutorial-completion-description">
      {{ $t('projectTutorial.completionDescription') }}
    </v-card-text>
    <v-btn @click="$emit('onStartMappingClick')">
      {{ $t('projectTutorial.startMapping') }}
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
