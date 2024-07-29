<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    drawType: {
      type: String,
      required: false,
    },
    instructionMessage: {
      type: String,
      required: true,
    },
  },
})
</script>

<template>
  <v-card-text>
    <div class="text-p">{{ instructionMessage }}.</div>
    <div class="text-h6 mt-10">{{ $t('digitizeProjectInstructions.switchMode') }}</div>
    <div class="text-p mt-2">
      <v-row align="center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-draw" color="primary" variant="tonal" rounded="0" />
        </v-col>
        <v-col>{{ $t('digitizeProjectInstructions.drawNewFeature') }}</v-col>
      </v-row>
      <v-row align="center" v-if="drawType != 'Box'" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-vector-polyline-edit" color="primary" variant="tonal" rounded="0" />
        </v-col>
        <v-col>{{ $t('digitizeProjectInstructions.modifyFeature') }}</v-col>
      </v-row>
      <v-row align="center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-delete" color="warning" variant="tonal" rounded="0" />
        </v-col>
        <v-col>{{ $t('digitizeProjectInstructions.deleteFeature') }}</v-col>
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
      <div class="text-h6 mt-10">{{ $t('projectInstructions.toggleOpacityTitle') }}</div>
      <div class="text-p mt-2">
        <v-row align="center" dense>
          <v-col cols="auto" class="mr-4">
            <v-btn color="primary" icon="mdi-eye" size="small" variant="text"> </v-btn>
          </v-col>
          <v-col>{{ $t('projectInstructions.toggleOpacityInstruction') }}.</v-col>
        </v-row>
      </div>

      <div class="text-h6 mt-10">{{ $t('projectInstructions.resetTitle') }}</div>
      <div class="text-p mt-2">
        <v-row align="center" dense>
          <v-col cols="auto" class="mr-4">
            <v-btn
              :title="$t('tileMap.resetView')"
              color="primary"
              icon="mdi-fit-to-screen-outline"
              size="small"
              variant="text"
            >
            </v-btn>
          </v-col>
          <v-col>{{ $t('projectInstructions.resetInstruction') }}</v-col>
        </v-row>
      </div>

      <div class="text-h6 mt-10">{{ $t('projectInstructions.saveYourAnswers') }}</div>
      <div class="text-p mt-2">
        <v-row class="align-center" dense>
          <v-col cols="auto" class="mr-4">
            <v-btn icon="mdi-content-save" color="primary" variant="text" />
          </v-col>
          <v-col>{{ $t('projectInstructions.seenAll') }}</v-col>
        </v-row>
      </div>
    </div>
  </v-card-text>
</template>

<style scoped></style>
