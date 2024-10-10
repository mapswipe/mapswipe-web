<script lang="ts">
import { Viewer } from 'mapillary-js'
import 'mapillary-js/dist/mapillary.css'
import { defineComponent } from 'vue'
// import createInformationPages from '@/utils/createInformationPages'
import OptionButtons from './OptionButtons.vue'
import ProjectHeader from './ProjectHeader.vue'
// import ProjectInfo from './ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
// import StreetProjectInstructions from './StreetProjectInstructions.vue'

export default defineComponent({
  components: {
    // streetProjectInstructions: StreetProjectInstructions,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    // projectInfo: ProjectInfo,
    taskProgress: TaskProgress,
  },
  props: {
    group: {
      type: Object,
      required: true,
    },
    /*
    first: {
      type: Boolean,
      default: false,
    },
    */
    options: {
      type: Array,
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
    },
    project: {
      type: Object,
      required: true,
    },
    tasks: {
      type: Array,
      required: true,
    },
    /*
    tutorial: {
      type: Object,
      require: false,
    },
    */
  },
  data() {
    return {
      arrowKeys: true,
      results: {},
      startTime: null,
      taskId: undefined,
      taskIndex: 0,
      viewer: null,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
  },
  computed: {
    instructionMessage() {
      const message = this.project?.lookFor
      return message
    },
  },
  methods: {
    // TODO: add geometry to result value?
    addResult(value) {
      this.results[this.taskId] = value
    },
    back() {
      if (!this.taskIndex <= 0) {
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
        this.viewer.moveTo(this.taskId)
      }
    },
    /* 
    createInformationPages,
    // fallback information pages for media projects tbd (could be similar to find projects)
    createFallbackInformationPages() {
      return undefined
    },
    */
    forward() {
      if (this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
        this.viewer.moveTo(this.taskId)
      }
    },
    initialiseViewer(imageId) {
      this.viewer = new Viewer({
        accessToken: import.meta.env.VITE_MAPILLARY_API_KEY,
        component: { cover: false },
        container: 'mapillary',
        imageId: imageId,
      })

      this.viewer.deactivateComponent('direction')
      this.viewer.deactivateComponent('sequence')
      this.viewer.deactivateComponent('keyboard')
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
  mounted() {
    this.initialiseViewer(this.taskId)
  },
})
</script>

<template>
  <project-header :instructionMessage="instructionMessage" :title="project?.projectTopic">
    <!--project-info
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <street-project-instructions
          :instructionMessage="instructionMessage"
          :options="options"
        />
      </template>
    </project-info-->
  </project-header>
  <v-container
    id="mapillary"
    class="ma-0 pa-0"
    v-touch="{ left: () => forward(), right: () => back() }"
    style="position: relative; height: calc(100vh - 375px)"
  />
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
      :title="$t('mediaProject.moveRight')"
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
