<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { clamp, createGeoJsonFromTasks } from '@/utils/common';
import buildTasks from '@/utils/buildTasks';
import type { CustomOption, Project, TaskGroup, TileTask } from '@/utils/types';
import BaseMap from './BaseMap.vue';
import { isDefined, listToMap } from '@togglecorp/fujs';
import TaskProgress from '@/components/TaskProgress.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import TileMap from '@/components/TileMap.vue'

interface Props {
  group: TaskGroup;
  first: boolean;
  options: CustomOption[];
  project: Project;
  tasks: TileTask[];
  tutorial: Object;
  tutorialTasks: unknown[];
}

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

const tileSize = ref(0);
const columnsPerPage = ref(0);
const taskOffset = ref(0);
const results = ref<Record<string, number>>({});
const selectedTasks = ref<Record<string, boolean>>({});

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
  )
  selectedTasks.value = listToMap(
    processedTasks.value,
    ({ taskId }) => taskId,
    () => false,
  )
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

function handleContainerResize() {
  if (containerRef.value) {
    const containerWidth = containerRef.value.$el?.clientWidth;

    const tentetiveTileHeight = Math.floor(window.innerHeight - 300) / ROWS_PER_PAGE;
    const maxTileSize = clamp(
      tentetiveTileHeight,
      128,
      512,
    )

    const remainder = containerWidth % maxTileSize;
    const ratio = containerWidth / maxTileSize;
    const rounded = remainder < 100
      ? Math.floor(ratio)
      : Math.ceil(ratio)

    const totalColumns = Math.ceil(processedTasks.value.length / ROWS_PER_PAGE)
    columnsPerPage.value = clamp(
      rounded,
      1,
      totalColumns,
    )

    tileSize.value = Math.min(
      maxTileSize,
      Math.floor(containerWidth / columnsPerPage.value) - 1,
    )
  }
}

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

</script>

<template>
  <project-header
    :mission="$t('projectView.youAreLookingFor', { lookFor: props.project.lookFor })"
    :title="props.project.projectTopic"
  >
    <v-chip v-if="numSelectedTasks > 0" color="primary" :ripple="false">
      {{ numSelectedTasks }}
      <span class="hidden-md-and-down">&nbsp;{{ $t('findProject.selected') }}</span>
      <v-icon @click="handleClearTaskSelection">mdi-close</v-icon>
    </v-chip>
    <tile-map :page="currentTasks" :zoomLevel="project.zoomLevel" :key="columnsPerPage" />
    <!--
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
          :mission="mission"
          :options="options"
        />
      </template>
      <template #tutorial>
        <find-project-tutorial
          :tutorial="tutorial"
          :tasks="tutorialTasks"
          :options="options"
          @tutorialComplete="$refs.projectInfo?.toggleDialog"
        />
      </template>
    </project-info>
    -->
  </project-header>
  <v-container
    ref="container"
    v-resize="handleContainerResize"
    class="container"
  >
    <base-map
      v-if="isDefined(geoJson)"
      :geo-json="geoJson"
      :map-width="viewportWidth"
      :map-height="viewportHeight"
      :map-state="mapState"
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
    />
    <v-btn
      :title="$t('findProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskOffset === 0"
      @click="handleBack"
    />
    <v-btn
      :title="$t('findProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="isLastPage"
      @click="handleForward"
    />
    <v-btn
      :title="$t('findProject.moveRight', { n: numFastForwardColumns })"
      icon="mdi-chevron-double-right"
      color="secondary"
      :disabled="isLastPage"
      @click="handleFastForward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskOffset" :total="processedTasks.length" />
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
