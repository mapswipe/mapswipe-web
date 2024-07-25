<script lang="ts">
import { defineComponent } from 'vue'
import createInformationPages from '@/utils/createInformationPages'
import OptionButtons from './OptionButtons.vue'
import ProjectHeader from './ProjectHeader.vue'
import ProjectInfo from './ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import MediaProjectInstructions from './MediaProjectInstructions.vue'

export default defineComponent({
  components: {
    mediaProjectInstructions: MediaProjectInstructions,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
    taskProgress: TaskProgress,
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
          { mdiIcon: 'mdi-check', color: 'green', title: 'Yes', value: 1 },
          { mdiIcon: 'mdi-cancel', color: 'red', title: 'No', value: 0 },
          { mdiIcon: 'mdi-head-question', color: '', title: 'Maybe', value: 2 },
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
      isImageLoaded: false,
      results: {},
      startTime: null,
      taskId: undefined,
      taskIndex: 0,
      zoomed: false,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
  },
  computed: {
    attribution() {
      const attribution = this.project?.mediaCredits || ''
      return attribution
    },
    instructionMessage() {
      const message = this.project?.lookFor
      return message
    },
    isImageTask() {
      const isImage = ['jpeg', 'jpg', 'gif', 'png', 'svg', 'bmp'].includes(this.mediaFileExtension)
      return isImage
    },
    isVideoTask() {
      const isVideo = ['mp4', 'webm', 'ogg'].includes(this.mediaFileExtension)
      return isVideo
    },
    mediaFileExtension() {
      const extension = new URL(this.tasks[this.taskIndex]?.media).pathname
        .split('.')
        .pop()
        .toLowerCase()
      return extension
    },
  },
  methods: {
    addResult(value) {
      this.results[this.taskId] = value
    },
    back() {
      if (!this.taskIndex <= 0) {
        this.imageLoaded = false
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
      }
    },
    createInformationPages,
    createFallbackInformationPages() {
      return undefined
    },
    forward() {
      if (this.isImageLoaded && this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
        this.imageLoaded = false
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
      }
    },
    isAnswered() {
      const result = this.results[this.taskId]
      const defined = result !== undefined
      return defined
    },
    onImageLoad() {
      this.isImageLoaded = true
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
  <project-header :instructionMessage="instructionMessage" :title="project?.projectTopic">
    <project-info
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
    >
      <template #instructions>
        <media-project-instructions
          :attribution="attribution"
          :instructionMessage="instructionMessage"
          :options="options"
        />
      </template>
    </project-info>
  </project-header>
  <v-container
    class="ma-0 pa-0"
    v-touch="{ left: () => forward(), right: () => back() }"
    style="position: relative"
  >
    <v-img
      v-if="isImageTask"
      :src="tasks[taskIndex].media"
      @load="onImageLoad"
      style="max-height: calc(100vh - 375px)"
    >
      <template #placeholder>
        <div class="d-flex align-center justify-center fill-height">
          <v-progress-circular color="primary" indeterminate />
        </div>
      </template>
    </v-img>
    <div v-else-if="isVideoTask">
      <video id="video" width="100%" height="500" controls autoplay muted>
        <source id="source" :src="tasks[taskIndex].media" />
      </video>
    </div>
  </v-container>
  <option-buttons
    v-if="taskId"
    :options="options"
    :result="results[taskId]"
    :taskId="taskId"
    @addResult="addResult"
  />
  <v-toolbar color="white" extension-height="20" density="compact" extended>
    <v-spacer />
    <v-btn
      :title="$t('mediaProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskIndex <= 0"
      @click="back"
      v-shortkey.once="['arrowleft']"
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
      :title="$t('mediaProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="!isImageLoaded || !isAnswered() || taskIndex + 1 === tasks.length"
      @click="forward"
      v-shortkey.once="['arrowright']"
      @shortkey="forward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex + isAnswered()" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
