<script lang="ts">
import createInformationPages from '@/utils/createInformationPages'
import StreetProjectTask from './StreetProjectTask.vue'
import StreetProjectTutorial from '@/components/StreetProjectTutorial.vue'
import OptionButtons from './OptionButtons.vue'
import ProjectHeader from './ProjectHeader.vue'
import ProjectInfo from './ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import StreetProjectInstructions from './StreetProjectInstructions.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    streetProjectInstructions: StreetProjectInstructions,
    streetProjectTask: StreetProjectTask,
    streetProjectTutorial: StreetProjectTutorial,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
    taskProgress: TaskProgress,
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
            description: 'the object you are looking for is in the image.',
            iconColor: '#bbcb7d',
            shortkey: 1,
            title: 'Yes',
            value: 1,
          },
          {
            mdiIcon: 'mdi-close-thick',
            description: 'the object you are looking for is NOT in the image.',
            iconColor: '#fd5054',
            shortkey: 2,
            title: 'No',
            value: 0,
          },
          {
            mdiIcon: 'mdi-minus-thick',
            description: "if you're not sure or there is bad imagery.",
            iconColor: '#adadad',
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
      required: false,
    },
    tutorialTasks: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {
      arrowKeys: true,
      isLoading: true,
      errorLoading: false,
      results: {},
      startTime: null,
      taskId: undefined,
      taskIndex: 0,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
    showSnackbar: 'showSnackbar',
  },
  computed: {
    mission() {
      const message = this.$t('projectView.youAreLookingFor', { lookFor: this.project.lookFor })
      return message
    },
  },
  methods: {
    addResult(value) {
      this.results[this.taskId] = value
    },
    back() {
      if (!this.isLoading && !this.taskIndex <= 0) {
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
        this.errorLoading = false
      }
    },
    createInformationPages,
    // currently no fallback information pages defined, same here
    createFallbackInformationPages() {
      return undefined
    },
    forward() {
      if (
        ((!this.isLoading && this.isAnswered()) || this.errorLoading) &&
        this.taskIndex + 1 < this.tasks.length
      ) {
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
        this.errorLoading = false
      }
    },
    handleImageError() {
      this.errorLoading = true
      this.addResult(null)
      this.showSnackbar(this.$t('streetProject.couldNotLoadImage'), 'error', 1200)
      this.forward()
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
  <project-header :mission="mission" :title="project?.projectTopic">
    <project-info
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <street-project-instructions :mission="mission" :options="options" />
      </template>
      <template #tutorial>
        <street-project-tutorial
          :tutorial="tutorial"
          :tasks="tutorialTasks"
          :options="options"
          @tutorialComplete="$refs.projectInfo?.toggleDialog"
        />
      </template>
    </project-info>
  </project-header>
  <street-project-task
    :taskId="taskId"
    @dataloading="(e) => (isLoading = e.loading)"
    @imageError="handleImageError(taskId)"
    style="position: relative; height: calc(100vh - 375px)"
  />
  <option-buttons
    v-if="taskId"
    :disabled="isLoading || errorLoading"
    :options="options"
    :result="results[taskId]"
    :taskId="taskId"
    @addResult="addResult"
  />
  <v-toolbar color="white" extension-height="20" density="compact" extended>
    <v-spacer />
    <v-btn
      :title="$t('streetProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="isLoading || taskIndex <= 0"
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
      :title="$t('streetProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="isLoading || !(isAnswered() || errorLoading) || taskIndex + 1 === tasks.length"
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
