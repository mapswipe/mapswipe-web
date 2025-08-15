<script lang="ts" setup>
import type { ImageTask } from '@/utils/types';


interface Props {
  task: ImageTask;
}

const props = defineProps<Props>();

</script>

<template>
  <v-img
    class="task-image"
    v-if="props.task.url"
    :src="props.task.url"
  >
    <template v-slot:placeholder>
      <v-row class="fill-height ma-0" align="center" justify="center">
        <v-progress-circular color="primary" indeterminate />
      </v-row>
    </template>
    <template v-slot:error>
      <v-row class="fill-height ma-0 image-failed" align="center" justify="center">
        {{ $t('imageTile.failureMessage') }}
      </v-row>
    </template>
  </v-img>
  <div class="image-not-available" v-if="!props.task.url">
    {{ $t('imageTile.notAvailableMessage') }}
  </div>
</template>

<style scoped>
.task-image {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
}
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
