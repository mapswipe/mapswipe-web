<script lang="ts" setup>
import type { CustomOption } from '@/utils/types'
import TileOverlay from './TileOverlay.vue';
import ImageTile from './ImageTile.vue';
import { ref } from 'vue';

interface Props {
  instruction: string;
  options: CustomOption[];
  exampleTileUrl?: string;
}

const props = defineProps<Props>()
const selected = ref(false);
const allSelected = ref(false);

</script>

<template>
  <v-card-text>
    <div class="text-h6">
      {{ $t('findProjectInstructions.classifyTitle') }}
    </div>
    <div class="text-p">
      {{ props.instruction }} {{ $t('findProjectInstructions.classifyInstruction') }}.
    </div>
    <v-row class="mt-2" dense>
      <v-col sm="auto" lg="auto" v-for="(option, index) in options" :key="index">
        <div class="example-tile">
          <tile-overlay
            class="tile-overlay"
            persistentLabel
            :color="option.iconColor"
            :label="option.title"
          />
          <image-tile
            :url="exampleTileUrl"
          />
        </div>
      </v-col>
    </v-row>
    <div class="text-h6 mt-5">{{ $t('findProjectInstructions.selectionTitle') }}</div>
    <v-row class="align-center" dense>
      <v-col cols="auto" class="mr-4">
        <v-btn
          color="neutral"
          style="opacity: 0.6"
          @click.stop="selected = !selected"
          :icon="selected ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
          size="small"
          variant="text"
        />
      </v-col>
      <v-col>{{ $t('findProjectInstructions.selectTile') }}.</v-col>
    </v-row>
    <v-row class="align-center" dense>
      <v-col cols="auto" class="mr-4">
        <v-btn
          :icon="'mdi-select-'.concat(allSelected ? 'off' : 'all')"
          @click="allSelected = !allSelected"
          color="primary"
          variant="text"
        />
      </v-col>
      <v-col>{{ $t('findProjectInstructions.selectAll') }}.</v-col>
    </v-row>
    <div class="text-h6 mt-10">{{ $t('projectInstructions.whereIamTitle') }}</div>
    <div class="text-p mt-2">
      <v-row align="center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn color="primary" icon="mdi-earth" size="small" variant="text"> </v-btn>
        </v-col>
        <v-col>{{ $t('projectInstructions.whereIamInstruction') }}</v-col>
      </v-row>
    </div>
    <div class="text-h6 mt-10">{{ $t('projectInstructions.useButtonsToNavigate') }}</div>
    <div class="text-p mt-2">
      <v-row class="align-center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-chevron-left" color="secondary" class="mr-2" variant="text" />
          <v-btn icon="mdi-chevron-right" color="secondary" variant="text" />
        </v-col>
        <v-col>{{ $t('projectInstructions.move') }}</v-col>
      </v-row>
    </div>

    <div class="text-h6 mt-10">{{ $t('projectInstructions.saveYourAnswers') }}</div>
    <div class="text-p mt-2">
      <v-row class="align-center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-content-save" color="primary" variant="text" />
        </v-col>
        <v-col>{{ $t('validateProjectInstructions.seenAll') }}</v-col>
      </v-row>
    </div>
  </v-card-text>
</template>

<style scoped>
.example-tile {
  width: 7rem;
  height: 7rem;
  position: relative;
  isolation: isolate;

  .tile-overlay {
    position: absolute;
    z-index: 1;
    width: 100%;
    height: 100%;
  }
}
</style>
