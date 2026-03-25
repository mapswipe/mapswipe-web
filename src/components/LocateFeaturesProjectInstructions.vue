<script lang="ts" setup>
import type { CustomOption } from '@/utils/types'
import TileOverlay from './TileOverlay.vue';
import ImageTile from './ImageTile.vue';

interface Props {
  instruction: string;
  options: CustomOption[];
  exampleTileUrl?: string;
}

const props = defineProps<Props>()

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
    <div class="text-h6 mt-10">{{ $t('projectInstructions.dontWorry') }}</div>
    <div class="text-p">{{ $t('projectInstructions.everyTaskIsViewedBy') }}.</div>
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
