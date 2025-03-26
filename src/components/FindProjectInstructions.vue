<script lang="ts">
import ImageTile from '@/components/ImageTile.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    imageTile: ImageTile,
  },
  props: {
    mission: {
      type: String,
      required: true,
    },
    options: {
      type: Array,
      required: true,
    },
    attribution: {
      type: String,
      require: false,
    },
    exampleTileUrls: {
      type: Array,
      required: true,
    },
  },
  data: () => ({
    allSelected: false,
    eyeOff: false,
    overlay: true,
    selected: false,
  }),
})
</script>

<template>
  <v-card-text>
    <div class="text-h6">{{ $t('findProjectInstructions.classifyTitle') }}</div>
    <div class="text-p">
      {{ mission }}. {{ $t('findProjectInstructions.classifyInstruction') }}.
    </div>
    <v-row class="mt-2" dense>
      <v-col sm="auto" lg="auto" v-for="(option, index) in options" :key="index">
        <v-card color="white" height="7em" width="7em" variant="outlined" rounded="0">
          <v-overlay
            v-model="overlay"
            @update:modelValue="overlay = true"
            :opacity="index == 0 ? 0 : 0.5"
            :scrim="option.color"
            class="justify-center align-center"
            contained
          >
            <h4>{{ option.label }}</h4>
          </v-overlay>
          <image-tile
            :url="exampleTileUrls[0]"
            :urlB="exampleTileUrls[1]"
            :opacityB="eyeOff ? 0.3 : 1"
            :spinner="false"
          />
        </v-card>
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
    <div class="text-p mt-2">{{ $t('findProjectInstructions.selectionInstruction') }}.</div>
    <div class="text-h6 mt-10">{{ $t('findProjectInstructions.haveCloserLook') }}</div>
    <div class="text-p mt-2">
      <v-row class="align-center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn
            color="neutral"
            style="opacity: 0.6"
            icon="mdi-magnify"
            size="small"
            variant="text"
          />
        </v-col>
        <v-col>{{ $t('findProjectInstructions.magnifyInstruction') }}.</v-col>
      </v-row>
    </div>
    <span v-if="exampleTileUrls[1]">
      <div class="text-h6 mt-10">
        {{ $t('projectInstructions.toggleOpacityTitle') }}
      </div>
      <div class="text-p mt-2">
        <v-row class="align-center" dense>
          <v-col cols="auto" class="mr-4">
            <v-btn
              :icon="'mdi-eye'.concat(eyeoff ? '-off' : '')"
              @click="eyeoff = !eyeoff"
              color="primary"
              variant="text"
            />
          </v-col>
          <v-col>{{ $t('projectInstructions.toggleOpacityInstruction') }}.</v-col>
        </v-row>
      </div>
    </span>
    <div class="text-h6 mt-10">{{ $t('projectInstructions.whereIamTitle') }}</div>
    <div class="text-p mt-2">
      <v-row align="center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn color="primary" icon="mdi-earth" size="small" variant="text"> </v-btn>
        </v-col>
        <v-col>{{ $t('projectInstructions.whereIamInstruction') }}</v-col>
      </v-row>
    </div>

    <div class="text-h6 mt-10">
      {{ $t('projectInstructions.useButtonsToNavigate') }}
    </div>
    <div class="text-p mt-2">
      <v-row class="align-center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-chevron-left" color="secondary" class="mr-2" variant="text" />
          <v-btn icon="mdi-chevron-right" color="secondary" variant="text" />
        </v-col>
        <v-col>{{ $t('findProjectInstructions.moveColumn') }}</v-col>
      </v-row>
      <v-row class="align-center" dense>
        <v-col cols="auto" class="mr-4">
          <v-btn icon="mdi-chevron-double-left" color="secondary" class="mr-2" variant="text" />
          <v-btn icon="mdi-chevron-double-right" color="secondary" variant="text" />
        </v-col>
        <v-col>{{ $t('findProjectInstructions.movePage') }}</v-col>
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
    <div class="text-h6 mt-10">{{ $t('projectInstructions.dontWorry') }}</div>
    <div class="text-p">{{ $t('projectInstructions.everyTaskIsViewedBy') }}.</div>
    <div class="text-h6 mt-10">{{ $t('projectInstructions.imageCredits') }}</div>
    <div class="text-p">{{ attribution }}</div>
  </v-card-text>
</template>

<style scoped></style>
