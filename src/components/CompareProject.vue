<script lang="ts">
import { defineComponent } from 'vue'
import createInformationPages from '@/utils/createInformationPages'
import OptionButtons from '@/components/OptionButtons.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from '@/components/ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import TileMap from '@/components/TileMap.vue'
import ImageTile from '@/components/ImageTile.vue'
import CompareProjectInstructions from '@/components/CompareProjectInstructions.vue'

export default defineComponent({
  components: {
    compareProjectInstructions: CompareProjectInstructions,
    taskProgress: TaskProgress,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
    imageTile: ImageTile,
    tileMap: TileMap,
  },
  props: {
    group: {
      type: Object,
      require: true,
    },
    first: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      default() {
        return [
          {
            description: "I don't see any change between the two images.",
            iconColor: '',
            title: 'No change',
            mdiIcon: 'mdi-equal',
            shortkey: 1,
            value: 0,
          },
          {
            description: 'There is change between the two images.',
            iconColor: 'green',
            title: 'Change',
            mdiIcon: 'mdi-not-equal-variant',
            shortkey: 2,
            value: 1,
          },
          {
            description: 'I am not sure.',
            iconColor: 'orange',
            title: 'Not sure',
            mdiIcon: 'mdi-head-question',
            shortkey: 3,
            value: 2,
          },
          {
            description: 'The imagery is bad or clouded.',
            iconColor: 'red',
            title: 'Bad imagery',
            mdiIcon: 'mdi-weather-cloudy',
            shortkey: 4,
            value: 3,
          },
        ]
      },
    },
    project: {
      type: Object,
      require: true,
    },
    tasks: {
      type: Array,
      require: true,
    },
    tutorial: {
      type: Object,
      require: false,
    },
  },
  data() {
    return {
      allAnswered: false,
      arrowKeys: true,
      overlay: true,
      results: {},
      startTime: null,
      task: {},
      taskId: undefined,
      taskIndex: 0,
      transparent: false,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
  },
  computed: {
    attribution() {
      const attribution = [this.project.tileServer.credits]
      const tileServerB = this.project.tileServerB
      if (tileServerB) attribution.push(tileServerB.credits)
      return attribution.join('; ')
    },
    instructionMessage() {
      const message = this.$t('compareProject.lookForChange', { lookFor: this.project?.lookFor })
      return message
    },
  },
  methods: {
    addResult(value) {
      this.results[this.taskId] = value
    },
    back() {
      if (!this.taskIndex <= 0) {
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
      }
    },
    createInformationPages,
    // currently no fallback information pages defined in mobile map, same here
    createFallbackInformationPages() {
      return undefined
    },
    forward() {
      if (this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
      }
    },
    isAnswered() {
      const result = this.results[this.taskId]
      const defined = result !== undefined
      return defined
    },
  },
  created() {
    this.startTime = new Date().toISOString()
    this.taskId = this.tasks[this.taskIndex].taskId
    this.$emit('created')
    this.logMappingStarted(this.project.projectType)
  },
})
</script>

<template>
  <project-header :instructionMessage="instructionMessage" :title="project.projectTopic">
    <tile-map :page="[tasks[taskIndex]]" :zoomLevel="project.zoomLevel" />
    <project-info
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <compare-project-instructions
          :attribution="attribution"
          :instructionMessage="instructionMessage"
          :options="options"
        />
      </template>
    </project-info>
  </project-header>
  <v-container class="pa-0" v-touch="{ left: () => forward(), right: () => back() }">
    <v-row>
      <v-col cols="12" md="6" align="center">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            :max-width="$vuetify.display.smAndDown ? '35vh' : '80vh'"
            v-bind="props"
            color="white"
            variant="outlined"
            rounded="0"
          >
            <v-overlay
              v-model="overlay"
              @update:modelValue="overlay = true"
              opacity="0"
              class="justify-center align-center"
              contained
            >
              <h2 v-show="isHovering">{{ $t('compareProject.before') }}</h2>
            </v-overlay>
            <image-tile
              :url="tasks[taskIndex].url"
              :spinner="true"
              :maxSize="$vuetify.display.smAndDown ? '35vh' : '65vh'"
            />
          </v-card>
        </v-hover>
      </v-col>
      <v-col cols="12" md="6" align="center">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            :max-width="$vuetify.display.smAndDown ? '35vh' : '65vh'"
            v-bind="props"
            color="white"
            variant="outlined"
            rounded="0"
          >
            <v-overlay
              v-model="overlay"
              @update:modelValue="overlay = true"
              opacity="0"
              class="justify-center align-center"
              contained
            >
              <h2 v-show="isHovering">{{ $t('compareProject.after') }}</h2>
            </v-overlay>
            <image-tile
              :url="tasks[taskIndex].urlB"
              :spinner="true"
              :maxSize="$vuetify.display.smAndDown ? '35vh' : '80vh'"
            />
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
  </v-container>

  <option-buttons
    v-if="taskId"
    :options="options"
    :result="results[taskId]"
    :taskId="taskId"
    @addResult="addResult"
  />
  <v-toolbar color="white" density="compact" extension-height="20" extended>
    <v-spacer />
    <v-btn
      :title="$t('changeProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskIndex <= 0"
      @click="back"
      v-shortkey.once="[arrowKeys ? 'arrowleft' : '']"
      @shortkey="back"
    />
    <v-btn
      :title="$t('projectView.saveResults')"
      icon="mdi-content-save"
      color="primary"
      :disabled="Object.keys(results).length < tasks.length"
      @click="saveResults(results, startTime)"
    />
    <v-btn
      :title="$t('changeProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="!isAnswered() || taskIndex + 1 === tasks.length"
      @click="forward"
      v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
      @shortkey="forward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex + isAnswered()" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
