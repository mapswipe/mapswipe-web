<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue'
import matchIcon from '@/utils/matchIcon'
import TaskProgress from '@/components/TaskProgress.vue'
import TutorialCompletionCard from './TutorialCompletionCard.vue'
import { createGeoJsonFromTasks, isDefined } from '@/utils/common'
import type { DefaultOption, OverlayTileServer, Tutorial, TutorialTileTask } from '@/utils/types'
import { isNotDefined, listToMap } from '@togglecorp/fujs'
import { useI18n } from 'vue-i18n'
import BaseMap from './BaseMap.vue'

interface Props {
  tutorial: Tutorial;
  options: DefaultOption[];
  tasks: TutorialTileTask[];
}

const props = defineProps<Props>();
const { t } = useI18n();

const currentTaskIndex = ref(0);
const userAttempts = ref(0);
const answersRevealed = ref(false);
const results = ref<Record<string, number>>({});
const selectedTasks = ref<Record<string, boolean>>({});
const debounceTimeoutRef = shallowRef();
const tileSize = ref(0);

const containerRef = useTemplateRef('container');

const optionMap = computed(() => {
      const maxOptionIndex = props.options.length - 1

      return listToMap(
        props.options.map((option, index) => ({
          ...option,
          nextOptionKey:
            index === maxOptionIndex ? props.options[0].value : props.options[index + 1].value,
        })),
        ({ value }) => value,
      );
});

const instruction = computed(
  () => isDefined(props.tutorial.projectInstruction)
    ? props.tutorial.projectInstruction
    : t('projectView.youAreLookingFor', { lookFor: props.tutorial.lookFor })
);

const currentScreen = computed(() => (
  // NOTE: this should be extracted from the `screen` property of current task
  props.tutorial?.screens[currentTaskIndex.value]
));

const taskList = computed(() => {
  if (!props.tasks) {
    return []
  }

  return props.tasks.filter(({ screen }) => screen === currentTaskIndex.value + 1)
});

const hasTasks = computed(() => isDefined(props.tasks) && props.tasks.length !== 0);
const hasCompletedAllTasks = computed(() => {
  if (!hasTasks.value) {
    return false
  }

  const maxIndex = props.tasks.length
  return currentTaskIndex.value === maxIndex
});

const answeredCorrectly = computed(() => {
  if (props.tasks.length === 0) {
    return false
  }

  if (hasCompletedAllTasks.value) {
    return true
  }

  if (!taskList.value || taskList.value.length === 0) {
    return false
  }

  const hasWrongAnswer = taskList.value.some(
    ({ taskId, referenceAnswer }) => referenceAnswer !== results.value[taskId],
  )

  return !hasWrongAnswer
});

const alertContent = computed(() => {
  if (!currentScreen.value) {
    return undefined
  }

  const { instructions, success, hint } = currentScreen.value;

  if (!answersRevealed.value && answeredCorrectly.value && success) {
    const icon = success.icon

    return {
      type: 'success' as const,
      title: success.title,
      text: success.description,
      icon: icon ? matchIcon(icon) : undefined,
    }
  }

  if (answersRevealed.value && hint) {
    const icon = hint.icon

    return {
      type: undefined,
      title: hint.title,
      text: hint.description,
      icon: icon ? matchIcon(icon) : undefined,
    }
  }

  if (!instructions) {
    return undefined
  }

  const icon = instructions.icon

  return {
    type: 'info' as const,
    title: instructions.title,
    text: instructions.description,
    icon: icon ? matchIcon(icon) : undefined,
  }
});

const geoJson = computed(() => (
  createGeoJsonFromTasks(taskList.value.map((task) => ({
    ...task,
    taskZ: props.tutorial.zoomLevel,
  }))
)));

const ROWS_PER_PAGE = 3;
const COLS_PER_PAGE = 2;

type GeoJsonProperties = NonNullable<(typeof geoJson.value)>['features'][number]['properties'];

const viewportWidth = computed(() => tileSize.value * COLS_PER_PAGE);
const viewportHeight = computed(() => tileSize.value * ROWS_PER_PAGE);

const overlayTileServer = computed(() => {
  if (isNotDefined(props.tutorial.overlayTileServer)) {
    return {
      type: 'raster' as const,
      raster: props.tutorial.tileServerB,
    } as OverlayTileServer;
  }

  return props.tutorial.overlayTileServer;
});

const mapState = computed(() => (
  taskList.value.map((task, i) => ({
    featureId: i + 1,
    state: [
      {
        key: 'result',
        value: results.value[task.taskId],
      },
      {
        key: 'selected',
        value: selectedTasks.value[task.taskId],
      },
    ],
  }))
));

function handleWindowResize() {
  window.clearTimeout(debounceTimeoutRef.value);
  debounceTimeoutRef.value = window.setTimeout(() => {
    if (containerRef.value) {
      const clientRect = containerRef.value.getBoundingClientRect();
      const containerWidth = clientRect.width;

      const usableHeight = clientRect.height;

      const maxTileHeight = Math.floor(usableHeight / ROWS_PER_PAGE);
      const tentetiveNumTiles = Math.max(
        2,
        Math.floor(containerWidth / maxTileHeight),
      );

      tileSize.value = Math.min(
        maxTileHeight,
        Math.floor(containerWidth / tentetiveNumTiles),
      );
    }
  }, 200);
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();
  results.value = listToMap(
    props.tasks,
    ({ taskId }) => taskId,
    () => props.options[0].value,
  );
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  window.clearTimeout(debounceTimeoutRef.value);
});

function nextTask() {
  if (!hasCompletedAllTasks.value) {
    if (hasCompletedAllTasks.value) {
      return
    }

    selectedTasks.value = {}
    currentTaskIndex.value += 1
    userAttempts.value = 0
    answersRevealed.value = false
  }
}

function getNextValueForTask(taskId: string) {
  const currentResult = results.value[taskId]

  if (!isDefined(currentResult)) {
    return props.options[0].value
  }

  const newValue = optionMap.value[optionMap.value[currentResult].nextOptionKey].value

  return newValue
}

function setResult(taskId: string, newValue: number) {
  results.value[taskId] = newValue
}

function updateResult(taskId: string) {
  if (!answersRevealed.value) {
    userAttempts.value += 1
    const newValue = getNextValueForTask(taskId)
    results.value[taskId] = newValue
  }
}

function handleTaskClick(featureProperties: GeoJsonProperties) {
  const { taskId } = featureProperties;

  const selectedTaskKeys = Object.keys(selectedTasks.value).filter(
    (taskKey) => !!selectedTasks.value[taskKey],
  )

  const hasSomeSelectedItem = selectedTaskKeys.length > 0
  const isTaskFromSelectedItem =
    selectedTaskKeys.findIndex((taskKey) => taskKey === taskId) !== -1

  if (hasSomeSelectedItem) {
    if (isTaskFromSelectedItem) {
      const newValue = getNextValueForTask(taskId)
      selectedTaskKeys.forEach((taskKey) => {
        setResult(taskKey, newValue)
      })
    }
  } else {
    updateResult(taskId)
  }
}

function handleTaskContextMenu(featureProperties: GeoJsonProperties) {
  const { taskId } = featureProperties;

  if (isDefined(results.value[taskId])) {
    selectedTasks.value[taskId] = !selectedTasks.value[taskId];
  } else {
    selectedTasks.value[taskId] = true;
  }
}

/*
function handleTileSelected(newValue: boolean, taskId: string) {
  selectedTasks.value[taskId] = newValue
}
*/

function showAnswer() {
  answersRevealed.value = true
  taskList.value.forEach((task) => {
    results.value[task.taskId] = task.referenceAnswer
  })
}

/*
export default defineComponent({
  emits: ['tutorialComplete'],
  mounted() {
    this.fillResults()
  },
})
*/

</script>

<template>
  <v-container>
    <v-row v-if="!hasCompletedAllTasks">
      <v-col>
        <div>
          {{ instruction }}
        </div>
      </v-col>
    </v-row>
    <v-row v-if="alertContent">
      <v-col>
        <v-alert
          prominent
          density="compact"
          border="start"
          variant="tonal"
          :type="alertContent.type"
          :title="alertContent.title"
          :text="alertContent.text"
          :icon="alertContent.icon"
        >
          <template #append>
            <v-btn
              v-if="userAttempts > 1 && !answeredCorrectly && !answersRevealed"
              @click="showAnswer"
            >
              {{ $t('projectTutorial.showAnswer') }}
            </v-btn>
            <v-btn v-if="!hasCompletedAllTasks && answeredCorrectly" @click="nextTask">
              {{ $t('projectTutorial.nextTask') }}
            </v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div
          ref="container"
          class="container"
        >
          <BaseMap
            v-if="isDefined(geoJson) && isDefined(overlayTileServer)"
            :geo-json="geoJson"
            :tile-size="tileSize"
            :map-width="viewportWidth"
            :map-height="viewportHeight"
            :map-state="mapState"
            :tile-server="props.tutorial.tileServer"
            :overlay-tile-server="overlayTileServer"
            @on-bound-feature-click="handleTaskClick"
            @on-bound-feature-context-menu="handleTaskContextMenu"
          />
        </div>
      </v-col>
    </v-row>
    <v-row v-if="!hasTasks" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate />
      </v-col>
    </v-row>
    <v-row v-if="hasTasks && !hasCompletedAllTasks">
      <v-col>
        <task-progress :progress="currentTaskIndex" :total="tutorial?.screens.length ?? 0" />
      </v-col>
    </v-row>
    <v-row v-if="hasCompletedAllTasks">
      <v-col>
        <tutorial-completion-card @on-start-mapping-click="$emit('tutorialComplete')" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
}
</style>
