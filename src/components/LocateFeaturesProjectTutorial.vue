<script lang="ts" setup>
import type { CustomOption, Tutorial, TutorialTileTask } from '@/utils/types';

interface Props {
  tutorial: Tutorial
  options: CustomOption[]
  tasks: TutorialTileTask[]
}

const props = defineProps<Props>()

</script>

<template>
  <v-container>
    Tutorial not implemented yet
  </v-container>
</template>
