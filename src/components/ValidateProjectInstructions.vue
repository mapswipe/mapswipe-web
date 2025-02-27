<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    mission: {
      type: String,
      required: true,
    },
    options: {
      type: Array,
      required: true,
    },
  },
})
</script>

<template>
  <v-card-text>
    <div class="text-h6">{{ $t('projectInstructions.classifyTitle') }}</div>
    <div class="text-p">{{ mission }} {{ $t('projectInstructions.classifyInstruction') }}.</div>

    <v-row v-for="(option, optionIndex) in options" :key="optionIndex" align="center" dense>
      <v-col cols="auto" class="mr-4">
        <v-btn
          class="mx-2 text-caption"
          width="6rem"
          :text="'(' + option.shortkey + ') ' + option.title"
          :color="option.iconColor"
          :prepend-icon="option.mdiIcon"
          variant="plain"
          stacked
        />
      </v-col>
      <v-col>{{ [option.title, option.description].filter(Boolean).join(': ') }}</v-col>
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

<style scoped></style>
