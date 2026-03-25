<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import type {
  Project,
  TaskGroup,
  Tutorial,
  CustomOption,
  TutorialTileTask,
  TileTask,
} from '@/utils/types'
import { computed, inject, onMounted, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { isDefined, isNotDefined, listToMap } from '@togglecorp/fujs'

import createInformationPages from '@/utils/createInformationPages'
import { createFallbackInformationPages } from '@/utils/domain'
import LocateFeaturesProjectTask from '@/components/LocateFeaturesProjectTask.vue'
import LocateFeaturesProjectInstructions from '@/components/LocateFeaturesProjectInstructions.vue'
import LocateFeaturesProjectTutorial from '@/components/LocateFeaturesProjectTutorial.vue'
import buildTasks from '@/utils/buildTasks'

import ProjectInfo from './ProjectInfo.vue'
import ProjectHeader from './ProjectHeader.vue'
import TaskProgress from './TaskProgress.vue'
import type { VContainer } from 'vuetify/components'
import TileMap from './TileMap.vue'

interface Props {
  group: TaskGroup
  first: boolean
  options: CustomOption[]
  project: Project
  tutorial: Tutorial
  tutorialTasks: TutorialTileTask[]
  tasks: TileTask[] | undefined
}

const taskOffset = ref(0)
const projectInfoRef = useTemplateRef('projectInfo')

const props = defineProps<Props>()
const taskContainer = shallowRef<VContainer | null>(null)

const logMappingStarted = inject<(projectType: string) => void>('logMappingStarted')
const saveResults =
  inject<(results: Record<string, number[]>, startTime: string) => void>('saveResults')
const arrowKeys = ref(true)
const startTime = shallowRef<string>()
const instruction = computed(() =>
  isDefined(props.project.projectInstruction)
    ? props.project.projectInstruction
    : t('validateProject.doesTheShapeOutline', { feature: props.project.lookFor }),
)

const emit = defineEmits<{ created: [] }>()
const results = ref<Record<string, number[]>>({})
const selectedTaskIndices = ref<Record<string, boolean[]>>({})
const tileSize = ref<number>(1);

const subGridSizeExponent = computed(() => {
  const subGridSizeToExponentMapping: Record<string, number> = {
    '2x2': 1,
    '4x4': 2,
    '8x8': 3,
  }

  if ('subGridSize' in props.project && typeof props.project.subGridSize === 'string') {
    return subGridSizeToExponentMapping[props.project.subGridSize] ?? 1;
  }

  return 1;
})

const processedTasks = computed(() => {
  const tasks = props.tasks?.length ? props.tasks : buildTasks(props.project, props.group)

  const sortedTasks = tasks.sort((a, b) => (a.taskId > b.taskId ? 1 : -1))

  return sortedTasks
})

const numSubGridElements = computed(() => ((2 ** subGridSizeExponent.value) ** 2))
const defaultSelectionValue = computed(() => (
  Array.from(new Array(numSubGridElements.value).keys()).map(
    () => false,
  )
))

watchEffect(() => {
  results.value = listToMap(
    processedTasks.value,
    ({ taskId }) => taskId,
    () => Array.from(new Array(numSubGridElements.value).keys()).map(
      () => props.options[0].value,
    ),
  )

  selectedTaskIndices.value = listToMap(
    processedTasks.value,
    ({ taskId }) => taskId,
    () => defaultSelectionValue.value,
  )

  startTime.value = new Date().toISOString()
})

const optionMapping = computed(() =>
  listToMap(
    props.options,
    ({ value }) => value,
  )
)
const nextOptionMapping = computed(() =>
  listToMap(
    props.options,
    ({ value }) => value,
    (_, __, index) => {
      if (index === props.options.length - 1) {
        return props.options[0].value
      }

      return props.options[index + 1].value
    },
  ),
)


const currentTask = computed(() => processedTasks.value?.[taskOffset.value] ?? {})
const currentTaskValue = computed(() => results.value[currentTask.value.taskId])
const currentTaskSelections = computed(() => selectedTaskIndices.value[currentTask.value.taskId])
const numSelectedTasks = computed(() => currentTaskSelections.value.filter((isSelected) => isSelected).length)

onMounted(() => {
  logMappingStarted?.(props.project.projectType)
  emit('created')
})

const isLastTask = computed(() => processedTasks.value.length - 1 === taskOffset.value)

function handleBack() {
  if (taskOffset.value > 0) {
    // reset selection
    selectedTaskIndices.value[currentTask.value.taskId] = defaultSelectionValue.value;

    taskOffset.value = taskOffset.value - 1
  }
}

function handleForward() {
  if (taskOffset.value < processedTasks.value.length - 1) {
    // reset selection
    selectedTaskIndices.value[currentTask.value.taskId] = defaultSelectionValue.value;


    taskOffset.value = taskOffset.value + 1
  }
}

function handleTaskValueChange(taskId: string, newValue: number[]) {
  results.value[taskId] = newValue
}

function handleTaskSelectionChange(taskId: string, newValue: boolean[]) {
  selectedTaskIndices.value[taskId] = newValue
}

function handleTaskContainerResize() {
  const el = taskContainer.value?.$el as HTMLDivElement | null;
  const bcr = el?.getBoundingClientRect();

  if (isNotDefined(bcr)) {
    return undefined;
  }

  const { width, height } = bcr;
  tileSize.value = Math.min(width, height);
}

function handleClearTaskSelection() {
  selectedTaskIndices.value[currentTask.value.taskId] = defaultSelectionValue.value;
}

const tileMapPage = computed(() => [currentTask.value])
const allTilesSelected = computed(() => numSelectedTasks.value === numSubGridElements.value)

function handleSelectAll() {
  if (allTilesSelected.value) {
    handleClearTaskSelection()
  } else {
    selectedTaskIndices.value[currentTask.value.taskId] = Array.from(
      new Array(numSubGridElements.value).keys()).map(() => true
    )
  }
}

</script>

<template>
  <ProjectHeader :mission="instruction">
    <v-chip v-if="numSelectedTasks > 0" color="primary" :ripple="false">
      {{ numSelectedTasks }}
      <span class="hidden-md-and-down">&nbsp;{{ $t('findProject.selected') }}</span>
      <v-icon @click="handleClearTaskSelection">mdi-close</v-icon>
    </v-chip>
    <v-btn
      :title="allTilesSelected ? $t('findProject.clearSelection') : $t('findProject.selectAll')"
      :icon="'mdi-select-'.concat(allTilesSelected ? 'off' : 'all')"
      @click="handleSelectAll"
      color="primary"
    />
    <TileMap
      :page="tileMapPage"
      :zoomLevel="project.zoomLevel"
    />
    <ProjectInfo
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(props.tutorial, props.project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <LocateFeaturesProjectInstructions
          :instruction="instruction"
          :options="props.options"
          :exampleTileUrl="processedTasks[0].url"
        />
      </template>
      <template #tutorial>
        <LocateFeaturesProjectTutorial
          :tutorial="tutorial"
          :tasks="tutorialTasks"
          :options="options"
          @tutorialComplete="projectInfoRef?.toggleDialog"
        />
      </template>
    </ProjectInfo>
  </ProjectHeader>
  <v-container
    class="ma-0 pa-0 container"
    ref="taskContainer"
    v-resize="handleTaskContainerResize"
  >
    <LocateFeaturesProjectTask
      :v-if="currentTask"
      :task="currentTask"
      :subGridSizeExponent="subGridSizeExponent"
      :value="currentTaskValue"
      @onValueChange="handleTaskValueChange"
      :optionMapping="optionMapping"
      :nextOptionMapping="nextOptionMapping"
      :tileSize="tileSize"
      :selectedIndices="selectedTaskIndices[currentTask.taskId]"
      @onSelectionChange="handleTaskSelectionChange"
    />
  </v-container>
  <v-toolbar color="white" density="compact" extension-height="20" extended>
    <v-spacer />
    <v-btn
      :title="$t('findProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskOffset <= 0"
      @click="handleBack"
      v-shortkey.once="[arrowKeys ? 'arrowleft' : '']"
      @shortkey="handleBack"
    />
    <v-btn
      v-if="isDefined(startTime)"
      :title="$t('projectView.saveResults')"
      icon="mdi-content-save"
      color="primary"
      :disabled="!isLastTask"
      @click="saveResults?.(results, startTime)"
    />
    <v-btn
      :title="$t('findProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="isLastTask"
      @click="handleForward"
      v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
      @shortkey="handleForward"
    />
    <v-spacer />
    <template #extension>
      <TaskProgress :progress="taskOffset + 1" :total="processedTasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped>
.container {
  height: calc(100vh - 20rem);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
