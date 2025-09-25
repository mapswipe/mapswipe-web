<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch, watchEffect } from 'vue';
import { createGeoJsonFromTasks } from '@/utils/common';
import buildTasks from '@/utils/buildTasks';
import type { DefaultOption, OverlayTileServer, Project, TaskGroup, TutorialTileTask, TileTask, Tutorial } from '@/utils/types';
import BaseMap from './BaseMap.vue';
import { isDefined, isNotDefined, listToMap } from '@togglecorp/fujs';
import TaskProgress from '@/components/TaskProgress.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import TileMap from '@/components/TileMap.vue'
import createInformationPages from '@/utils/createInformationPages';
import { createFallbackInformationPages } from '@/utils/domain';
import ProjectInfo from './ProjectInfo.vue';
import FindProjectInstructions from './FindProjectInstructions.vue';
import { useI18n } from 'vue-i18n';
import CompletenessProjectTutorial from './CompletenessProjectTutorial.vue';

interface Props {
  group: TaskGroup;
  first: boolean;
  options: DefaultOption[];
  project: Project;
  tasks: TileTask[];
  tutorial: Tutorial;
  tutorialTasks: TutorialTileTask[];
}

const logMappingStarted = inject<(projectType: string) => void>('logMappingStarted');
const saveResults = inject<(results: Record<string, number>, startTime: string) => void>('saveResults');

// TODO: check if this is needed
// const showSnackbar = inject<() => void>('showSnackbar');

const emit = defineEmits<{ created: []}>();
const { t } = useI18n();

const ROWS_PER_PAGE = 3;

const props = withDefaults(defineProps<Props>(), {
  options: () => [
    { color: '', label: 'no', value: 0 },
    { color: 'green', label: 'yes', value: 1 },
    { color: 'orange', label: 'maybe', value: 2 },
    { color: 'red', label: 'bad imagery', value: 3 },
  ],
});

const containerRef = useTemplateRef('container');
const projectInfoRef = useTemplateRef('projectInfo');

const tileSize = ref(0);
const columnsPerPage = ref(0);
const taskOffset = ref(0);
const arrowKeys = ref(true);
const results = ref<Record<string, number>>({});
const selectedTasks = ref<Record<string, boolean>>({});
const debounceTimeoutRef = shallowRef();
const startTime = shallowRef<string>();

const instruction = computed(
  () => isDefined(props.project.projectInstruction)
    ? props.project.projectInstruction
    : t('projectView.youAreLookingFor', { lookFor: props.project.lookFor })
);

const numSelectedTasks = computed(() => Object.values(selectedTasks.value).filter(Boolean).length);

const processedTasks = computed(() => {
  const tasks = props.tasks.length
    ? props.tasks
    : buildTasks(props.project, props.group);

  const sorted = tasks.sort(
    (a, b) => (a.taskId > b.taskId ? 1 : -1),
  );

  return sorted;
});

watchEffect(() => {
  results.value = listToMap(
    processedTasks.value,
    ({ taskId }) => taskId,
    () => props.options[0].value,
  );
  selectedTasks.value = listToMap(
    processedTasks.value,
    ({ taskId }) => taskId,
    () => false,
  );
  startTime.value = new Date().toISOString();
});

const currentTasks = computed(() => {
  const numTasks = columnsPerPage.value * ROWS_PER_PAGE;
  return [...processedTasks.value].splice(taskOffset.value, numTasks);
});

// clear selected tasks when they're out of viewport
watch(currentTasks, (newValue, oldValue) => {
  const newValueMapping = listToMap(
    newValue,
      ({ taskId }) => taskId,
      () => true
  );
  oldValue.forEach((task) => {
    if (!newValueMapping[task.taskId]) {
      selectedTasks.value[task.taskId] = false;
    }
  });
});

const mapState = computed(() => (
  currentTasks.value.map((task, i) => ({
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

const geoJson = computed(() => (
  createGeoJsonFromTasks(currentTasks.value)
));

const overlayTileServer = computed(() => {
  if (isNotDefined(props.project.overlayTileServer)) {
    return {
      type: 'raster' as const,
      raster: props.project.tileServerB,
    } as OverlayTileServer;
  }

  return props.project.overlayTileServer;
});

const numFastBackColumns = computed(() => Math.min(taskOffset.value, columnsPerPage.value));
const numFastForwardColumns = computed(
  () => Math.min(
    processedTasks.value.length - taskOffset.value + columnsPerPage.value * ROWS_PER_PAGE,
    columnsPerPage.value
  ),
);
const isLastPage = computed(
  () => processedTasks.value.length <= taskOffset.value + columnsPerPage.value * ROWS_PER_PAGE
);

type GeoJsonProperties = NonNullable<(typeof geoJson.value)>['features'][number]['properties'];

const viewportWidth = computed(() => tileSize.value * columnsPerPage.value);
const viewportHeight = computed(() => tileSize.value * ROWS_PER_PAGE);

function handleWindowResize() {
  window.clearTimeout(debounceTimeoutRef.value);
  debounceTimeoutRef.value = window.setTimeout(() => {
    if (containerRef.value) {
      const clientRect = containerRef.value.$el?.getBoundingClientRect();
      const containerWidth = clientRect.width;

      const usableHeight = window.innerHeight - 300;

      const maxTileHeight = Math.floor(usableHeight / ROWS_PER_PAGE);
      const tentetiveNumTiles = Math.max(
        2,
        Math.floor(containerWidth / maxTileHeight),
      );

      columnsPerPage.value = tentetiveNumTiles;
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
  logMappingStarted?.(props.project.projectType);
  emit('created');
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
  window.clearTimeout(debounceTimeoutRef.value);
});

const nextOptionMapping = computed(() => listToMap(
  props.options,
  ({ value }) => value,
  (_, __, index) => {
    if (index === props.options.length - 1) {
      return props.options[0].value;
    }

    return props.options[index + 1].value;
  },
));

function handleTaskClick(featureProperties: GeoJsonProperties) {
  const currentSelectedTasks = currentTasks.value.filter(
    ({ taskId }) => selectedTasks.value[taskId]
  );

  const { taskId } = featureProperties;
  const newValue = isDefined(results.value[taskId])
    ? nextOptionMapping.value[results.value[taskId]]
    : props.options[0].value;

  results.value[taskId] = newValue;

  currentSelectedTasks.forEach(({ taskId: selectedTaskId }) => {
    results.value[selectedTaskId] = newValue;
  });
}

function handleTaskContextMenu(featureProperties: GeoJsonProperties) {
  const { taskId } = featureProperties;

  if (isDefined(results.value[taskId])) {
    selectedTasks.value[taskId] = !selectedTasks.value[taskId];
  } else {
    selectedTasks.value[taskId] = true;
  }
}

function handleBack() {
  taskOffset.value = Math.max(0, taskOffset.value - ROWS_PER_PAGE);
}

function handleFastBack() {
  taskOffset.value = Math.max(0, taskOffset.value - numFastBackColumns.value * ROWS_PER_PAGE);
}

function handleForward() {
  taskOffset.value = Math.min(
    processedTasks.value.length - columnsPerPage.value * ROWS_PER_PAGE,
    taskOffset.value + ROWS_PER_PAGE
  );
}

function handleFastForward() {
  taskOffset.value = Math.min(
    processedTasks.value.length - columnsPerPage.value * ROWS_PER_PAGE,
    taskOffset.value + numFastForwardColumns.value * ROWS_PER_PAGE
  );
}

function handleClearTaskSelection() {
  currentTasks.value.forEach((task) => {
    selectedTasks.value[task.taskId] = false;
  });
}

function handleSelectAll() {
  if (numSelectedTasks.value === currentTasks.value.length) {
    handleClearTaskSelection();
  } else {
    currentTasks.value.forEach(({ taskId }) => {
      selectedTasks.value[taskId] = true;
    });
  }
}

const attribution = computed(() => ([
  props.project.tileServer.credits,
  overlayTileServer.value.type === 'vector'
    ? overlayTileServer.value.vector.tileServer.credits
    : overlayTileServer.value.raster.credits
].join('; ')));

</script>

<template>
  <project-header
    :mission="instruction"
    :title="props.project.projectTopic"
  >
    <v-chip v-if="numSelectedTasks > 0" color="primary" :ripple="false">
      {{ numSelectedTasks }}
      <span class="hidden-md-and-down">&nbsp;{{ $t('findProject.selected') }}</span>
      <v-icon @click="handleClearTaskSelection">mdi-close</v-icon>
    </v-chip>
    <tile-map :page="currentTasks" :zoomLevel="project.zoomLevel" :key="columnsPerPage" />
    <v-btn
      :title="numSelectedTasks === currentTasks.length ? $t('findProject.clearSelection') : $t('findProject.selectAll')"
      :icon="'mdi-select-'.concat(numSelectedTasks === currentTasks.length ? 'off' : 'all')"
      @click="handleSelectAll"
      color="primary"
    />
    <ProjectInfo
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(props.tutorial, props.project, createFallbackInformationPages)"
      :manualUrl="props.project.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <FindProjectInstructions
          :attribution="attribution"
          :exampleTileUrls="[currentTasks[0]?.url, currentTasks[0]?.urlB]"
          :mission="instruction"
          :options="options"
        />
      </template>
      <template #tutorial>
        <CompletenessProjectTutorial
          :tutorial="props.tutorial"
          :tasks="props.tutorialTasks"
          :options="options"
          @tutorialComplete="projectInfoRef?.toggleDialog"
        />
      </template>
    </ProjectInfo>
  </project-header>
  <v-container
    ref="container"
    class="container"
    v-touch="{ left: () => handleFastForward(), right: () => handleFastBack() }"
  >
    <BaseMap
      v-if="isDefined(geoJson) && isDefined(overlayTileServer)"
      :geo-json="geoJson"
      :tile-size="tileSize"
      :map-width="viewportWidth"
      :map-height="viewportHeight"
      :map-state="mapState"
      :tile-server="props.project.tileServer"
      :overlay-tile-server="overlayTileServer"
      @on-bound-feature-click="handleTaskClick"
      @on-bound-feature-context-menu="handleTaskContextMenu"
    />
  </v-container>
  <v-toolbar color="white" extension-height="20" density="compact" tag="div" extended>
    <v-spacer />
    <v-btn
      :title="$t('findProject.moveLeft', { n: numFastBackColumns })"
      icon="mdi-chevron-double-left"
      color="secondary"
      :disabled="taskOffset === 0"
      @click="handleFastBack"
      v-shortkey.once="[arrowKeys ? 'arrowdown' : '']"
      @shortkey="handleFastBack"
    />
    <v-btn
      :title="$t('findProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskOffset === 0"
      @click="handleBack"
      v-shortkey.once="[arrowKeys ? 'arrowleft' : '']"
      @shortkey="handleBack"
    />
    <v-btn
      v-if="isDefined(startTime)"
      :title="$t('projectView.saveResults')"
      icon="mdi-content-save"
      color="primary"
      :disabled="!isLastPage"
      @click="saveResults?.(results, startTime)"
    />
    <v-btn
      :title="$t('findProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="isLastPage"
      @click="handleForward"
      v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
      @shortkey="handleForward"
    />
    <v-btn
      :title="$t('findProject.moveRight', { n: numFastForwardColumns })"
      icon="mdi-chevron-double-right"
      color="secondary"
      :disabled="isLastPage"
      @click="handleFastForward"
      v-shortkey.once="[arrowKeys ? 'arrowup' : '']"
      @shortkey="handleFastForward"
    />
    <v-spacer />
    <template #extension>
      <task-progress
        :progress="taskOffset + columnsPerPage * ROWS_PER_PAGE"
        :total="processedTasks.length"
      />
    </template>
  </v-toolbar>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
