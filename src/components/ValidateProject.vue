<script lang="ts">
import { defineComponent } from 'vue'
import { Collection } from 'ol'
import createInformationPages from '@/utils/createInformationPages'
import { theme } from '@/plugins/vuetify'
import OptionButtons from '@/components/OptionButtons.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from '@/components/ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import ValidateProjectInstructions from '@/components/ValidateProjectInstructions.vue'
import ValidateProjectTutorial from '@/components/ValidateProjectTutorial.vue'
import ValidateProjectTask from './ValidateProjectTask.vue'

export default defineComponent({
  components: {
    validateProjectInstructions: ValidateProjectInstructions,
    validateProjectTutorial: ValidateProjectTutorial,
    validateProjectTask: ValidateProjectTask,
    taskProgress: TaskProgress,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
  },
  props: {
    group: {
      type: Object,
      required: true,
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
            mdiIcon: 'mdi-check-bold',
            description: `The shape does outline a building in the image`,
            iconColor: '#388E3C',
            shortkey: 1,
            title: 'Yes',
            value: 1,
          },
          {
            mdiIcon: 'mdi-close-thick',
            description: `The shape doesn't match a building in the image`,
            iconColor: '#D32F2F',
            shortkey: 2,
            title: 'No',
            value: 0,
          },
          {
            mdiIcon: 'mdi-minus-thick',
            description: `If you're not sure or there is cloud cover / bad imagery.`,
            iconColor: '#616161',
            title: 'Not sure',
            shortkey: 3,
            value: 2,
          },
        ]
      },
    },
    project: {
      type: Object,
      required: true,
    },
    tasks: {
      type: Array,
      required: true,
    },
    tutorial: {
      type: Object,
      require: false,
    },
  },
  data() {
    return {
      arrowKeys: true,
      center: [0, 0],
      results: {},
      startTime: null,
      taskFeatures: new Collection(),
      taskId: undefined,
      taskIndex: 0,
      transparent: false,
      zoom: 3,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
  },
  computed: {
    colors() {
      const colors = theme
      return colors
    },
    mission() {
      const message = this.$t('validateProject.doesTheShapeOutline', {
        feature: this.project?.lookFor,
      })
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
    // fallback information pages of mobile app adapted to web app:
    createFallbackInformationPages(tutorial) {
      if (tutorial.lookFor) {
        return [
          {
            blocks: [
              {
                blockNumber: 1,
                blockType: 'text',
                // web app displays shapes on a web map rather than on a single image
                textDescription:
                  "You'll see a shape on an interactive imagery map. Use the buttons to answer.",
              },
              {
                blockNumber: 2,
                blockType: 'text',
                // instead of 'buildings', we get the feature of interest from Firebase (similar as in Find projects)
                textDescription: `Does the shape outline a ${tutorial.lookFor}?`,
              },
              {
                blockNumber: 3,
                blockType: 'text',
                textDescription:
                  "Every time you select an option, you'll be shown a new shape and image.",
              },
            ],
            pageNumber: 1,
            title: 'What to look for',
          },
        ]
      } else {
        return undefined
      }
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
  <project-header :mission="mission" :title="project.projectTopic">
    <v-btn
      :title="$t('findProject.toggleOpacity')"
      :icon="'mdi-eye'.concat(transparent ? '-off' : '')"
      @click="transparent = !transparent"
      color="primary"
    />
    <v-btn
      :title="$t('tileMap.resetView')"
      icon="mdi-fit-to-screen-outline"
      @click="$refs['validate-project-task']?.fitView()"
      color="primary"
    />
    <project-info
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <validate-project-instructions :mission="mission" :options="options" />
      </template>
      <template #tutorial>
        <validate-project-tutorial
          :tutorial="tutorial"
          :options="options"
          @tutorialComplete="$refs.projectInfo?.toggleDialog"
        />
      </template>
    </project-info>
  </project-header>
  <v-container class="ma-0 pa-0">
    <validate-project-task
      ref="validate-project-task"
      :task="tasks?.[taskIndex]"
      :project="project"
      :transparent="transparent"
    />
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
      :title="$t('validateProject.moveLeft')"
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
      :title="$t('validateProject.moveRight')"
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
