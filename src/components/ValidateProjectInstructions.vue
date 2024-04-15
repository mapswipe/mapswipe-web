<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    instructionMessage: {
      type: String,
      required: true,
    },
    first: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      required: true,
    },
  },
  data: () => ({
    dialog: false,
  }),
  created() {
    this.dialog = this.first
  },
})
</script>

<template>
  <v-btn
    :title="$t('findProjectInstructions.howToContribute')"
    icon="mdi-information"
    color="primary"
    @click="dialog = true"
  />
  <v-dialog v-model="dialog" max-width="800" eager scrollable>
    <v-card>
      <v-card-title class="text-h5">{{
        $t('findProjectInstructions.howToContribute')
      }}</v-card-title>
      <v-card-text>
        <div class="text-h6">{{ $t('findProjectInstructions.classifyTitle') }}</div>
        <div class="text-p">
          {{ instructionMessage }} {{ $t('validateProjectInstructions.classifyInstruction') }}.
        </div>

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

        <div class="text-h6 mt-10">{{ $t('findProjectInstructions.toggleOpacityTitle') }}</div>
        <div class="text-p mt-2">
          <v-row align="center" dense>
            <v-col cols="auto" class="mr-4">
              <v-btn color="primary" icon="mdi-eye" size="small" variant="text"> </v-btn>
            </v-col>
            <v-col>{{ $t('findProjectInstructions.toggleOpacityInstruction') }}.</v-col>
          </v-row>
        </div>

        <div class="text-h6 mt-10">{{ $t('validateProjectInstructions.resetTitle') }}</div>
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
            <v-col>{{ $t('validateProjectInstructions.resetInstruction') }}</v-col>
          </v-row>
        </div>

        <div class="text-h6 mt-10">{{ $t('findProjectInstructions.useButtonsToNavigate') }}</div>
        <div class="text-p mt-2">
          <v-row class="align-center" dense>
            <v-col cols="auto" class="mr-4">
              <v-btn icon="mdi-chevron-left" color="secondary" class="mr-2" variant="text" />
              <v-btn icon="mdi-chevron-right" color="secondary" variant="text" />
            </v-col>
            <v-col>{{ $t('digitizeProjectInstructions.move') }}</v-col>
          </v-row>
        </div>

        <div class="text-h6 mt-10">{{ $t('findProjectInstructions.saveYourAnswers') }}</div>
        <div class="text-p mt-2">
          <v-row class="align-center" dense>
            <v-col cols="auto" class="mr-4">
              <v-btn icon="mdi-content-save" color="primary" variant="text" />
            </v-col>
            <v-col>{{ $t('validateProjectInstructions.seenAll') }}</v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-spacer />
        <v-btn
          v-if="manualUrl"
          color="primary"
          :href="manualUrl"
          target="_blank"
          prepend-icon="mdi-help-circle"
          >{{ $t('findProjectInstructions.moreInfo') }}</v-btn
        >
        <v-btn color="primary" @click="dialog = false">{{
          $t('findProjectInstructions.close')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
