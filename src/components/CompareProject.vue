<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import createInformationPages from '@/utils/createInformationPages'
import OptionButtons from '@/components/OptionButtons.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from '@/components/ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import TileMap from '@/components/TileMap.vue'
import CompareProjectInstructions from '@/components/CompareProjectInstructions.vue'
import CompareProjectTutorial, { type Tutorial } from '@/components/CompareProjectTutorial.vue'
import CompareProjectTask, { type Task } from '@/components/CompareProjectTask.vue'
import { type Option } from '@/components/OptionButtons.vue'
import { isDefined } from '@/utils/common'

// NOTE: is only for compare project
interface ProjectCompareType {
  projectType: string
  projectTopic: string
  name: string
  zoomLevel: number
  manualUrl?: string
  tileServer: {
    credits: string
  }
  tileServerB: {
    credits: string
  }
  credits: string
  lookFor: string
}

const defaultOptions: Option[] = [
  {
    description: "I don't see any change between the two images.",
    iconColor: '#adadad',
    title: 'No change',
    mdiIcon: 'mdi-equal',
    shortkey: 1,
    value: 0,
  },
  {
    description: 'There is change between the two images.',
    iconColor: '#bbcb7d',
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
    iconColor: '#fd5054',
    title: 'Bad imagery',
    mdiIcon: 'mdi-weather-cloudy',
    shortkey: 4,
    value: 3,
  },
]

export default defineComponent({
  components: {
    compareProjectInstructions: CompareProjectInstructions,
    compareProjectTutorial: CompareProjectTutorial,
    compareProjectTask: CompareProjectTask,
    taskProgress: TaskProgress,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
    tileMap: TileMap,
  },
  props: {
    // FIXME: this prop is not used
    group: {
      type: Object,
      required: true,
    },
    first: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array as PropType<Option[]>,
      default() {
        return defaultOptions
      },
    },
    project: {
      type: Object as PropType<ProjectCompareType>,
      required: true,
    },
    tasks: {
      type: Array as PropType<Task[]>,
      required: true,
    },
    tutorial: {
      type: Object as PropType<Tutorial>,
      required: false,
    },
  },
  data(): {
    allAnswered: boolean
    arrowKeys: boolean
    overlay: boolean
    results: Record<string, number | undefined>
    startTime: string | null
    task: object
    taskId: string | undefined
    taskIndex: number
    transparent: boolean
  } {
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
  // NOTE: These are not typesafe.
  // We can use the inject method on setup and add explicity type
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
    addResult(value: number | undefined) {
      if (isDefined(this.taskId)) {
        this.results[this.taskId] = value
      }
    },
    back() {
      if (this.taskIndex > 0) {
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
      if (!this.taskId) {
        return false
      }
      const result = this.results[this.taskId]
      const defined = result !== undefined
      return defined
    },
  },
  emits: ['created'],
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
      ref="projectInfo"
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
          :verificationNumber="project.verificationNumber"
        />
      </template>
      <template #tutorial>
        <compare-project-tutorial
          :tutorial="tutorial"
          :options="options"
          @tutorialComplete="$refs.projectInfo?.toggleDialog"
        />
      </template>
    </project-info>
  </project-header>
  <v-container v-touch="{ left: () => forward(), right: () => back() }">
    <compare-project-task :task="tasks?.[taskIndex]" />
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
      <task-progress :progress="taskIndex + (isAnswered() ? 1 : 0)" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
