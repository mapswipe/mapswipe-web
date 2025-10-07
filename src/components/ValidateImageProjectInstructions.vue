<script lang="ts" setup>
import OptionButton from '@/components/OptionButton.vue'
import type { CustomOption } from '@/utils/types'

interface Props {
  instruction: string
  options: CustomOption[]
}

const props = defineProps<Props>()
</script>

<template>
  <v-card-text>
    <div class="text-h6">
      {{ $t('projectInstructions.classifyTitle') }}
    </div>
    <div class="text-p">
      {{ props.instruction }} {{ $t('projectInstructions.classifyInstruction') }}.
    </div>
    <v-row v-for="(option, optionIndex) in props.options" :key="optionIndex" align="center" dense>
      <v-col cols="auto" class="mt-5 mr-4">
        <option-button :option="option" :only-icon="true" />
      </v-col>
      <v-col class="mt-5">{{
        [option.title, option.description].filter(Boolean).join(': ')
      }}</v-col>
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

<style scoped></style>
