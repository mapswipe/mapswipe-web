<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import buildTasks from '@/utils/buildTasks'
import createInformationPages from '@/utils/createInformationPages'
import FindProjectInstructions from '@/components/FindProjectInstructions.vue'
import FindProjectTutorial from '@/components/FindProjectTutorial.vue'
import FindProjectTask, { type Option } from '@/components/FindProjectTask.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from '@/components/ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import TileMap from '@/components/TileMap.vue'

export default defineComponent({
  components: {
    findProjectInstructions: FindProjectInstructions,
    findProjectTutorial: FindProjectTutorial,
    findProjectTask: FindProjectTask,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
    tileMap: TileMap,
    taskProgress: TaskProgress,
  },
  props: {
    group: {
      type: Object,
      required: true,
    },
    // TODO: On implementation of interactive tutorials, change this so that instructions dialog is opened with tutorial, but not with project
    first: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array as PropType<Option[]>,
      default() {
        return [
          { color: '', label: 'no', value: 0 },
          { color: 'green', label: 'yes', value: 1 },
          { color: 'orange', label: 'maybe', value: 2 },
          { color: 'red', label: 'bad imagery', value: 3 },
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
      columnIndex: 0,
      containerWidth: 1,
      endReached: false,
      maxTileSize: 1,
      page: [],
      results: {},
      selectedTaskIds: [],
      startTime: null,
      taskIndex: 0,
      transparent: false,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
    showSnackbar: 'showSnackbar',
  },
  watch: {
    processedTasks: {
      handler(newTasks) {
        newTasks.forEach((task) => (this.results[task.taskId] = this.options[0].value))
        this.startTime = new Date().toISOString()
      },
      immediate: true,
    },
  },
  computed: {
    optionMap() {
      return this.options.reduce((acc, val) => {
        acc[val.value] = val;

        return acc;
      }, {} as Record<number, Option>);
    },
    allTilesSelected() {
      return this.selectedTaskIds.length === this.page.flat().length
    },
    attribution() {
      const attribution = [this.project.tileServer.credits]
      const tileServerB = this.project.tileServerB
      if (tileServerB) attribution.push(tileServerB.credits)
      return attribution.join('; ')
    },
    backDisabled() {
      return this.columnIndex <= 0
    },
    columnsPerPage() {
      const remainder = this.containerWidth % this.maxTileSize
      const ratio = this.containerWidth / this.maxTileSize
      const rounded = remainder < 100 ? Math.floor(ratio) : Math.ceil(ratio)
      const columnsPerPage = this.clamp(rounded, 1, this.totalColumns)
      return columnsPerPage
    },
    instructionMessage() {
      const verb = this.project.tileServerB ? 'findProject.compare' : 'findProject.lookFor'
      const message = this.$t(verb, { lookFor: this.project.lookFor })
      return message
    },
    forwardDisabled() {
      return this.isLastPage
    },
    isLastPage() {
      let rightColumnIndex = Math.max(this.columnIndex, 0) + this.columnsPerPage
      let lastPage = rightColumnIndex >= this.totalColumns
      return lastPage
    },
    processedTasks() {
      const tasks = this.tasks.length ? this.tasks : buildTasks(this.project, this.group)
      const sorted = tasks.sort((a, b) => (a.taskId > b.taskId ? 1 : -1))
      return sorted
    },
    rowsPerPage() {
      // all pages should have 3 rows of image tiles
      return 3
    },
    tasksPerPage() {
      let tasksPerPage = this.rowsPerPage * this.columnsPerPage
      return tasksPerPage
    },
    tilesInSelection() {
      return this.selectedTaskIds.length > 0
    },
    tileSize() {
      const tileSize = Math.min(
        this.maxTileSize,
        Math.floor(this.containerWidth / this.columnsPerPage) - 1,
      )
      return tileSize
    },
    totalColumns() {
      let totalColumns = Math.ceil(this.processedTasks.length / this.rowsPerPage)
      return totalColumns
    },
    iconSize() {
      const size = this.tileSize < 256 ? 'x-small' : 'small'
      return size
    },
  },
  methods: {
    appendColorAndLabel(task) {
      const value = this.results[task.taskId]
      const index = this.options.findIndex((option) => option.value == value)
      task.index = index || 0
      task.value = this.options[index].value
      task.color = this.options[index].color
      task.label = this.options[index].label
      return task
    },
    back() {
      if (!this.backDisabled) {
        this.removeFromSelection(this.page.map((row) => row.pop()).map((t) => t.taskId))
        this.columnIndex--
        this.updatePage()
      }
    },
    bumpResult(taskId: string, currentOptionIndex: number) {
      if (currentOptionIndex < this.options.length - 1) {
        this.results[taskId] = this.options[currentOptionIndex + 1].value
      } else {
        this.results[taskId] = this.options[0].value
      }
    },
    clamp(value: number, min: number, max: number) {
      const clamp = Math.min(Math.max(value, min), max)
      return clamp
    },
    createInformationPages,
    createFallbackInformationPages(tutorial) {
      if (tutorial.exampleImage1 && tutorial.exampleImage2 && tutorial.lookFor) {
        return [
          {
            blocks: [
              {
                blockNumber: 1,
                blockType: 'text',
                textDescription: `You are looking for ${tutorial.lookFor}.`,
              },
              {
                blockNumber: 2,
                blockType: 'text',
                textDescription: 'From the ground, it looks like this:',
              },
              {
                blockNumber: 3,
                blockType: 'image',
                image: tutorial.exampleImage1,
              },
              {
                blockNumber: 4,
                blockType: 'text',
                textDescription:
                  'But the images you will see will show it from above, and it looks like this:',
              },
              {
                blockNumber: 5,
                blockType: 'image',
                image: tutorial.exampleImage2,
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
    getCheckboxIcon(taskId) {
      const selected = this.isTaskSelected(taskId)
      const icon = selected ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'
      return icon
    },
    getOverlayBorder(taskId) {
      const selected = this.isTaskSelected(taskId)
      const style = selected ? 'border: 20px solid #ccca' : ''
      return style
    },
    handleSelectAll() {
      this.selectedTaskIds = this.allTilesSelected ? [] : this.page.flat().map((t) => t.taskId)
    },
    handleTileClicked(taskId: string) {
      const currentResult = this.results[taskId]
      const currentOptionIndex = this.options.findIndex((option) => option.value == currentResult)

      if (!this.tilesInSelection) {
        this.bumpResult(taskId, currentOptionIndex)
      } else if (this.selectedTaskIds.includes(taskId)) {
        this.selectedTaskIds.map((t) => this.bumpResult(t, currentOptionIndex))
      }
      this.updatePage()
    },
    handleTileSelected(newValue: boolean, taskId: string) {
      if (newValue) {
        this.selectedTaskIds.push(taskId);
      } else {
        this.selectedTaskIds = this.selectedTaskIds.filter((t) => t != taskId)
      }
    },
    fastBack() {
      if (!this.backDisabled) {
        this.removeFromSelection(this.page.flat().map((t) => t.taskId))
        let target = this.columnIndex - this.columnsPerPage
        this.columnIndex = Math.max(target, 0)
        this.updatePage()
      }
    },
    fastBackColumns() {
      return Math.min(this.columnIndex, this.columnsPerPage)
    },
    fastForward() {
      if (!this.forwardDisabled) {
        this.removeFromSelection(this.page.flat().map((t) => t.taskId))
        let target = this.columnIndex + this.columnsPerPage
        let max = this.totalColumns - this.columnsPerPage
        this.columnIndex = Math.min(target, max)
        this.updatePage()
        if (this.isLastPage) this.endReached = true
      }
    },
    fastForwardColumns() {
      const remaining = this.totalColumns - this.columnIndex - this.columnsPerPage
      return Math.min(remaining, this.columnsPerPage)
    },
    forward() {
      if (!this.forwardDisabled) {
        this.removeFromSelection(this.page.map((row) => row[0]).map((t) => t.taskId))
        this.columnIndex++
        this.updatePage()
        if (this.isLastPage) this.endReached = true
      }
    },
    isTaskSelected(taskId) {
      const selected = this.selectedTaskIds.includes(taskId)
      return selected
    },
    onResize() {
      const container = this.$refs.container.$el as HTMLElement
      this.containerWidth = container.clientWidth
      const maxTileHeight = this.clamp(
        Math.floor(window.innerHeight - 300) / this.rowsPerPage,
        128,
        512,
      )
      this.maxTileSize = maxTileHeight
      this.updatePage()
    },
    removeFromSelection(taskIds: Array<string>) {
      const newSelection = this.selectedTaskIds.filter((t) => !taskIds.includes(t))
      const difference = this.selectedTaskIds.length - newSelection.length
      if (difference > 0) {
        console
        this.showSnackbar(this.$t('findProject.removedFromSelection', { n: difference }), 'info')
      }
      this.selectedTaskIds = newSelection
    },
    updatePage() {
      this.columnIndex = Math.min(this.columnIndex, this.totalColumns - this.columnsPerPage)
      let begin = Math.max(this.columnIndex * this.rowsPerPage, 0)
      let end = begin + this.tasksPerPage
      let pageTasks = this.processedTasks.slice(begin, end).map(this.appendColorAndLabel)
      let uniqueY = [...new Set(pageTasks.map((task) => parseInt(task.taskY)))].sort()
      this.page = []
      for (let y of uniqueY) {
        let row = pageTasks
          .filter((task) => parseInt(task.taskY) === y)
          .sort((a, b) => parseInt(a.taskX) > parseInt(b.taskX))
        this.page.push(row)
      }

      if (this.processedTasks.length <= this.tasksPerPage) {
        this.endReached = true
        this.taskIndex = this.processedTasks.length
      }
      this.taskIndex = (this.columnIndex + this.columnsPerPage) * this.rowsPerPage
    },
  },
  mounted() {
    this.onResize()
  },
  emits: ['created'],
  created() {
    this.$emit('created')
    this.logMappingStarted(this.project.projectType)
  },
})
</script>

<template>
  <project-header :instructionMessage="instructionMessage" :title="project.projectTopic">
    <v-chip v-if="tilesInSelection" color="primary" :ripple="false">
      {{ selectedTaskIds.length }}
      <span class="hidden-md-and-down">&nbsp;{{ $t('findProject.selected') }}</span>
      <v-icon @click="selectedTaskIds = []">mdi-close</v-icon>
    </v-chip>
    <v-btn
      :title="allTilesSelected ? $t('findProject.clearSelection') : $t('findProject.selectAll')"
      :icon="'mdi-select-'.concat(allTilesSelected ? 'off' : 'all')"
      @click="handleSelectAll"
      color="primary"
    />
    <v-btn
      v-if="page.flat()[0]?.urlB"
      :title="$t('findProject.toggleOpacity')"
      :icon="'mdi-eye'.concat(transparent ? '-off' : '')"
      @click="transparent = !transparent"
      color="primary"
    />
    <tile-map :page="page" :zoomLevel="project.zoomLevel" :key="columnsPerPage" />
    <project-info
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <find-project-instructions
          :attribution="attribution"
          :exampleTileUrls="[page.flat()[0]?.url, page.flat()[0]?.urlB]"
          :instructionMessage="instructionMessage"
          :options="options"
        />
      </template>
      <template #tutorial>
        <find-project-tutorial
          :tutorial="tutorial"
          :options="options"
          @tutorialComplete="$refs.projectInfo?.toggleDialog"
          />
      </template>
    </project-info>
  </project-header>

  <v-container
    v-if="page"
    v-resize="onResize"
    v-touch="{ left: () => fastForward(), right: () => fastBack() }"
    class="pa-0"
    ref="container"
  >
    <v-row v-for="(row, index) in page" :key="index" justify="center" no-gutters>
      <div v-for="task in row" :key="task.taskId" :width="tileSize" class="mx-0 px-0">
        <find-project-task
          :task="task"
          :tilesInSelection="tilesInSelection"
          :selected="selectedTaskIds.includes(task.taskId)"
          :transparent="transparent"
          :optionMap="optionMap"
          :tileSize="tileSize"
          :value="results[task.taskId]"
          @updateValue="handleTileClicked"
          @updateSelected="handleTileSelected"
        />
      </div>
    </v-row>
  </v-container>
  <v-toolbar color="white" extension-height="20" density="compact" tag="div" extended>
    <v-spacer />
    <v-btn
      :title="$t('findProject.moveLeft', { n: fastBackColumns() })"
      icon="mdi-chevron-double-left"
      color="secondary"
      :disabled="columnIndex <= 0"
      @click="fastBack"
      v-shortkey.once="[arrowKeys ? 'arrowdown' : '']"
      @shortkey="fastBack"
    />
    <v-btn
      :title="$t('findProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="columnIndex <= 0"
      @click="back"
      v-shortkey.once="[arrowKeys ? 'arrowleft' : '']"
      @shortkey="back"
    />
    <v-btn
      :title="$t('projectView.saveResults')"
      icon="mdi-content-save"
      color="primary"
      :disabled="!endReached"
      @click="saveResults(results, startTime)"
    />
    <v-btn
      :title="$t('findProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="isLastPage"
      @click="forward"
      v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
      @shortkey="forward"
    />
    <v-btn
      :title="$t('findProject.moveRight', { n: fastForwardColumns() })"
      icon="mdi-chevron-double-right"
      color="secondary"
      :disabled="isLastPage"
      @click="fastForward"
      v-shortkey.once="[arrowKeys ? 'arrowup' : '']"
      @shortkey="fastForward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex" :total="processedTasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
