<script lang="ts">
import ImageTile from '@/components/ImageTile.vue'
import { defineComponent } from 'vue'
import VueMarkdown from 'vue-markdown-render'

export default defineComponent({
  components: {
    imageTile: ImageTile,
    VueMarkdown,
  },
  props: {
    informationPages: {
      type: Array,
      required: false,
    },
    instructionMessage: {
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
      require: true,
    },
    manualUrl: {
      type: String,
      require: false,
    },
    first: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    allSelected: false,
    dialog: false,
    eyeOff: false,
    overlay: true,
    selected: false,
    tabs: null,
  }),
  methods: {
    closeDialog() {
      this.dialog = false
    },
  },
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
  <v-dialog v-model="dialog" max-width="70vw" height="80vh">
    <v-card v-click-outside="closeDialog">
      <v-tabs v-model="tabs" show-arrows>
        <v-tab
          v-for="page in informationPages"
          :text="page.title"
          :value="page.title"
          :key="page.pageNumber"
        ></v-tab>
        <v-tab :text="$t('findProjectInstructions.howToContribute')" value="instructions"></v-tab>
      </v-tabs>

      <v-window v-model="tabs" class="scroll">
        <v-window-item v-for="page in informationPages" :value="page.title" :key="page.pageNumber">
          <span v-for="block in page.blocks" :key="block.blockNumber">
            <v-card-text v-if="block.blockType === 'text'">
              <vue-markdown
                :source="block.textDescription.replaceAll('\\n', '\n')"
                :options="{ typographer: true }"
              />
            </v-card-text>
            <v-img v-if="block.blockType === 'image'" :src="block.image" max-width="400"></v-img>
          </span>
        </v-window-item>
        <v-window-item value="instructions">
          <v-card-text>
            <div class="text-h6">{{ $t('findProjectInstructions.classifyTitle') }}</div>
            <div class="text-p">
              {{ instructionMessage }}. {{ $t('findProjectInstructions.classifyInstruction') }}.
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
                  :icon="
                    selected ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'
                  "
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
                {{ $t('findProjectInstructions.toggleOpacityTitle') }}
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
                  <v-col>{{ $t('findProjectInstructions.toggleOpacityInstruction') }}.</v-col>
                </v-row>
              </div>
            </span>
            <div class="text-h6 mt-10">{{ $t('compareProjectInstructions.whereIamTitle') }}</div>
            <div class="text-p mt-2">
              <v-row align="center" dense>
                <v-col cols="auto" class="mr-4">
                  <v-btn color="primary" icon="mdi-earth" size="small" variant="text"> </v-btn>
                </v-col>
                <v-col>{{ $t('compareProjectInstructions.whereIamInstruction') }}</v-col>
              </v-row>
            </div>

            <div class="text-h6 mt-10">
              {{ $t('findProjectInstructions.useButtonsToNavigate') }}
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
                  <v-btn
                    icon="mdi-chevron-double-left"
                    color="secondary"
                    class="mr-2"
                    variant="text"
                  />
                  <v-btn icon="mdi-chevron-double-right" color="secondary" variant="text" />
                </v-col>
                <v-col>{{ $t('findProjectInstructions.movePage') }}</v-col>
              </v-row>
            </div>
            <div class="text-h6 mt-10">{{ $t('findProjectInstructions.saveYourAnswers') }}</div>
            <div class="text-p mt-2">
              <v-row class="align-center" dense>
                <v-col cols="auto" class="mr-4">
                  <v-btn icon="mdi-content-save" color="primary" variant="text" />
                </v-col>
                <v-col>{{ $t('findProjectInstructions.seenAll') }}</v-col>
              </v-row>
            </div>
            <div class="text-h6 mt-10">{{ $t('findProjectInstructions.imageCredits') }}</div>
            <div class="text-p">{{ attribution }}</div>
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
        </v-window-item>
      </v-window>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
