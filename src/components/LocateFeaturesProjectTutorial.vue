<script lang="ts" setup>
import matchIcon from '@/utils/matchIcon';
import type { CustomOption, Project, Tutorial, TutorialTileTask } from '@/utils/types';
import { isDefined, isNotDefined, listToGroupList, listToMap, mapToList } from '@togglecorp/fujs';
import { computed, onMounted, ref, shallowRef, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VContainer } from 'vuetify/components';
import LocateFeaturesProjectTask from './LocateFeaturesProjectTask.vue';
import TaskProgress from './TaskProgress.vue';
import TutorialCompletionCard from './TutorialCompletionCard.vue';

const { t } = useI18n()

interface Props {
  tutorial: Tutorial
  options: CustomOption[]
  tasks: TutorialTileTask[]
  project: Project;
  subGridSizeExponent: number;
  optionMapping: Record<string, CustomOption>;
  nextOptionMapping: Record<number, number>;
}

const props = defineProps<Props>()
const taskContainer = shallowRef<VContainer | null>(null)

const currentTaskIndex = ref(0)
const userAttempts = ref(0)
const answersRevealed = ref(false)
const results = ref<Record<string, number[]>>({})
const selectedTaskIndices = ref<Record<string, boolean[]>>({})
const tileSize = ref<number>(1);

const instruction = computed(() =>
  isDefined(props.tutorial.projectInstruction)
    ? props.tutorial.projectInstruction
    : t('projectView.youAreLookingFor', { lookFor: props.tutorial.lookFor }),
)

const numSubGridElements = computed(() => ((2 ** props.subGridSizeExponent) ** 2))

const defaultSelectionValue = computed(() => (
  Array.from(new Array(numSubGridElements.value).keys()).map(
    () => false,
  )
))

const processedTasks = computed(() => (
  mapToList(
    listToGroupList(
      props.tasks,
      (task) => task.screen,
      undefined,
      (group) => {
        const referenceAnswer = listToMap(
          group,
          ({ taskPartitionIndex }) => taskPartitionIndex ?? -1,
          ({ referenceAnswer }) => referenceAnswer,
        );

        return {
          ...group[0],
          reference: defaultSelectionValue.value.map((_, i) => (
            referenceAnswer[i] ?? props.options[0].value
          )),
        }
      }
    )
  )
))

const hasTasks = computed(() => isDefined(processedTasks) && processedTasks.value.length !== 0)

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
})

const currentTask = computed(() => processedTasks.value?.[currentTaskIndex.value])
const currentResult = computed(() => results.value[currentTask.value?.taskId])

const hasCompletedAllTasks = computed(() => {
  if (!hasTasks.value) {
    return false
  }

  const maxIndex = processedTasks.value.length
  return currentTaskIndex.value === maxIndex
})

const currentScreen = computed(() => props.tutorial?.screens[currentTaskIndex.value])

const answeredCorrectly = computed(() => {
  if (!hasTasks.value) {
    return false
  }

  if (hasCompletedAllTasks.value) {
    return true
  }

  const currentResultMapping = listToMap(
    currentResult.value,
    (_, i) => i,
    (referenceAnswser) => referenceAnswser,
  );

  const hasWrongAnswer = currentTask.value.reference.some(
    (referenceAnswser, i) => currentResultMapping[i] !== referenceAnswser
  )

  return !hasWrongAnswer;
})

const alertContent = computed(() => {
  if (!currentScreen.value) {
    return undefined
  }

  // FIXME: we may not have success and hint for this project type
  const { instructions, success, hint } = currentScreen.value

  if (answeredCorrectly.value && success) {
    const icon = success.icon

    return {
      type: 'success' as const,
      title: success.title,
      text: success.description,
      icon: icon ? matchIcon(icon) : undefined,
    }
  }

  // FIXME: max allowed user attempts should be dynamic?
  if (userAttempts.value > 0 && hint) {
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
})

function showAnswer() {
  answersRevealed.value = true
  results.value[currentTask.value?.taskId] = currentTask.value.reference
}

function nextTask() {
  if (!hasCompletedAllTasks.value) {
    currentTaskIndex.value += 1
    userAttempts.value = 0
    answersRevealed.value = false
  }
}

function handleTaskContainerResize() {
  // NOTE: we need timeout due to tab animation
  window.setTimeout(() => {
    const el = taskContainer.value?.$el as HTMLDivElement | null;
    const bcr = el?.getBoundingClientRect();

    if (isNotDefined(bcr)) {
      return undefined;
    }

    const { width, height } = bcr;
    tileSize.value = Math.min(width, height);
  }, 200);
}

onMounted(() => {
  handleTaskContainerResize()
})

function handleTaskValueChange(taskId: string, newValue: number[]) {
  if (!answersRevealed.value) {
    userAttempts.value += 1
    results.value[taskId] = newValue
  }
}

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
      <v-col />
    </v-row>
    <v-container
      class="ma-0 pa-0 task-container"
      ref="taskContainer"
      v-resize="handleTaskContainerResize"
      v-if="currentTask && !hasCompletedAllTasks"
    >
      <LocateFeaturesProjectTask
        :task="currentTask"
        :subGridSizeExponent="subGridSizeExponent"
        :value="currentResult"
        @onValueChange="handleTaskValueChange"
        :optionMapping="optionMapping"
        :nextOptionMapping="nextOptionMapping"
        :tileSize="tileSize"
        :selectedIndices="selectedTaskIndices[currentTask?.taskId]"
      />
    </v-container>
    <v-row>
      <v-col />
    </v-row>
    <v-row v-if="!hasTasks" justify="center">
      <v-col cols="12">
        <v-progress-circular indeterminate />
      </v-col>
    </v-row>
    <v-row v-if="hasTasks && !hasCompletedAllTasks">
      <v-col>
        <TaskProgress :progress="currentTaskIndex" :total="tutorial?.screens.length ?? 0" />
      </v-col>
    </v-row>
    <v-row v-if="hasCompletedAllTasks">
      <v-col>
        <TutorialCompletionCard @on-start-mapping-click="$emit('tutorialComplete')" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.task-container {
  width: 100%;
  height: calc(100vh - 22rem);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
