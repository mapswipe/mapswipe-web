<script lang="ts" setup>

import { isDefined } from '@togglecorp/fujs';
import { computed, inject, onMounted, ref, shallowRef, watchEffect } from 'vue';
import type { Project, TaskGroup, TutorialTileTask, Tutorial, CustomOption, ImageTask } from '@/utils/types';
import ValidateImageProjectTask from '@/components/ValidateImageProjectTask.vue';
import OptionButtons from '@/components/OptionButtons.vue';
import TaskProgress from './TaskProgress.vue';
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from './ProjectInfo.vue';
import createInformationPages from '@/utils/createInformationPages';
import { createFallbackInformationPages } from '@/utils/domain';

interface Props {
  group: TaskGroup;
  first: boolean;
  options: CustomOption[];
  project: Project;
  tasks: ImageTask[];
  tutorial: Tutorial;
  tutorialTasks: TutorialTileTask[];
}

const taskOffset = ref(0);
// const projectInfoRef = useTemplateRef('projectInfo');

const props = withDefaults(defineProps<Props>(), {
  options: () => [
    {
      mdiIcon: 'mdi-check-bold',
      description: `The shape does outline a building in the image`,
      iconColor: '#388E3C',
      shortKey: 1,
      title: 'Yes',
      value: 1,
    },
    {
      mdiIcon: 'mdi-close-thick',
      description: `The shape doesn't match a building in the image`,
      iconColor: '#D32F2F',
      shortKey: 2,
      title: 'No',
      value: 0,
    },
    {
      mdiIcon: 'mdi-minus-thick',
      description: `If you're not sure or there is cloud cover / bad imagery.`,
      iconColor: '#616161',
      title: 'Not sure',
      shortKey: 3,
      value: 2,
    },
  ],
});

const logMappingStarted = inject<(projectType: string) => void>('logMappingStarted');
const saveResults = inject<(results: Record<string, number>, startTime: string) => void>('saveResults');
const arrowKeys = ref(true);
const startTime = shallowRef<string>();

const emit = defineEmits<{ created: []}>();
const results = ref<Record<string, number>>({});

watchEffect(() => {
  startTime.value = new Date().toISOString();
});


const currentTask = computed(() => props.tasks[taskOffset.value]);

onMounted(() => {
  logMappingStarted?.(props.project.projectType);
  emit('created');
});

function addResult(newValue: number) {
  results.value[currentTask.value.taskId] = newValue;
}

const isLastTask = computed(
  () => (props.tasks.length - 1) === taskOffset.value
);
const currentTaskAnswered = computed(
  () => isDefined(results.value[currentTask.value.taskId])
)

function handleBack() {
  if (taskOffset.value > 0) {
    taskOffset.value = taskOffset.value - 1;
  }
}

function handleForward() {
  if (taskOffset.value < (props.tasks.length - 1)) {
    taskOffset.value = taskOffset.value + 1;
  }
}

</script>

<template>
  <ProjectHeader
    :mission="$t('projectView.youAreLookingFor', { lookFor: props.project.lookFor })"
  >
    <Project-info
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(props.tutorial, props.project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <!-- TODO: add instruction -->
      <!--
      <template #instructions>
        <validate-project-instructions :mission="mission" :options="options" />
      </template>
      -->
      <!-- FIXME: add tutorial -->
      <!--
      <template #tutorial>
        <validate-project-tutorial
          :tutorial="tutorial"
          :tasks="tutorialTasks"
          :options="options"
          @tutorialComplete="projectInfoRef?.toggleDialog"
        />
      </template>
      -->
      <!-- FIXME: add tutorial -->
    </Project-info>
  </ProjectHeader>
  <v-container
    class="ma-0 pa-0 container"
  >
    <ValidateImageProjectTask
      :task="currentTask"
    />
  </v-container>
  <OptionButtons
    v-if="currentTask"
    :options="props.options"
    :result="results[currentTask.taskId]"
    :taskId="currentTask.taskId"
    @addResult="addResult"
  />
  <v-toolbar color="white" density="compact" extension-height="20" extended>
    <v-spacer />
    <v-btn
      :title="$t('validateProject.moveLeft')"
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
      :title="$t('validateProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="!currentTaskAnswered || isLastTask"
      @click="handleForward"
      v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
      @shortkey="handleForward"
    />
    <v-spacer />
    <template #extension>
      <TaskProgress :progress="taskOffset + 1" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped>
.container {
  height: calc(100vh - 390px);
}
</style>
