<script lang="ts">
import createInformationPages from '@/utils/createInformationPages'
import StreetProjectTask from './StreetProjectTask.vue'
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
            iconColor: '#bbcb7d',
            shortkey: 1,
            title: 'Yes',
            value: 1,
          },
          {
            mdiIcon: 'mdi-close-thick',
            iconColor: '#fd5054',
            shortkey: 2,
            title: 'No',
            value: 0,
          },
          {
            mdiIcon: 'mdi-minus-thick',
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
  },
  data() {
    return {
      arrowKeys: true,
      currentImageId: undefined,
      isLoading: true,
      results: {},
      startTime: null,
      taskId: undefined,
      taskIndex: 0,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
  },
  computed: {
    instructionMessage() {
      const message = this.$t('streetProject.lookFor', { lookFor: this.project?.lookFor })
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
    // fallback information pages for street projects tbd
    createFallbackInformationPages() {
      return undefined
    },
    forward() {
      if (!this.isLoading && this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
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
  <project-header :instructionMessage="instructionMessage" :title="project?.projectTopic">
    {{ group.groupId }} {{ taskId }}
    <project-info
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <street-project-instructions :instructionMessage="instructionMessage" :options="options" />
      </template>
    </project-info>
  </project-header>
  <street-project-task
    :taskId="taskId"
    @dataloading="(e) => (isLoading = e.loading)"
    @image="(e) => (currentImageId = e.image.id)"
  />
  <option-buttons
    v-if="taskId"
    :disabled="isLoading || taskId != currentImageId"
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
      :title="$t('streetProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="isLoading || !isAnswered() || taskIndex + 1 === tasks.length"
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
