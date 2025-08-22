<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { isDefined } from '@togglecorp/fujs';
import matchIcon from '@/utils/matchIcon'
import type { CustomOption, Tutorial, TutorialImageTask } from '@/utils/types';
import ValidateImageProjectTask from './ValidateImageProjectTask.vue';
import OptionButtons from '@/components/OptionButtons.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import TutorialCompletionCard from '@/components/TutorialCompletionCard.vue'

const { t } = useI18n();

interface Props {
  tutorial: Tutorial;
  options: CustomOption[];
  tasks: TutorialImageTask[];
}

const props = defineProps<Props>();

const currentTaskIndex = ref(0);
const userAttempts = ref(0);
const answersRevealed = ref(false);
const results = ref<Record<string, number>>({});

const instruction = computed(
  () => t('validateProject.doesTheShapeOutline', { feature: props.tutorial.lookFor })
);

const hasTasks = computed(() => isDefined(props.tasks) && props.tasks.length !== 0);

const task = computed(() => (
  props.tasks?.[currentTaskIndex.value]
))

const hasCompletedAllTasks = computed(() => {
      if (!hasTasks.value) {
        return false
      }

      const maxIndex = props.tasks.length
      return currentTaskIndex.value === maxIndex
});

const currentScreen = computed(() => (
     props.tutorial?.screens[currentTaskIndex.value]
));

const answeredCorrectly = computed(() => {
  if (!hasTasks.value) {
    return false
  }

  if (hasCompletedAllTasks.value) {
    return true
  }

  const result = results.value[task.value?.taskId]
  return isDefined(result) && result === task.value?.referenceAnswer
});

const alertContent = computed(() => {
  if (!currentScreen.value) {
    return undefined
  }

  // FIXME: we may not have success and hint for this project type
  const { instructions, success, hint } = currentScreen.value;

  if (answeredCorrectly.value && success) {
    const icon = success.icon

    return {
      type: 'success' as const,
      title: success.title,
      text: success.description,
      icon: icon ? matchIcon(icon) : undefined,
    }
  }

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
});

function showAnswer() {
  answersRevealed.value = true;
  results.value[task.value.taskId] = task.value.referenceAnswer;
}

function nextTask() {
  if (!hasCompletedAllTasks.value) {
    currentTaskIndex.value += 1
    userAttempts.value = 0
    answersRevealed.value = false
  }
}

function addResult(value: number) {
  if (!answersRevealed.value) {
    userAttempts.value += 1;
    results.value[task.value.taskId] = value;
  }
};

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
          v-if="tasks[currentTaskIndex] && tutorial"
          class="task-container"
        >
          <ValidateImageProjectTask
            :task="tasks[currentTaskIndex]"
          />
        </div>
      </v-col>
    </v-row>
    <v-row v-if="options">
      <v-col>
        <option-buttons
          v-if="task?.taskId"
          :options="options"
          :result="results[task.taskId]"
          :taskId="task.taskId"
          @addResult="addResult"
        />
      </v-col>
    </v-row>
    <v-row v-if="!hasTasks" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate />
      </v-col>
    </v-row>
    <v-row v-if="hasTasks && !hasCompletedAllTasks">
      <v-col>
        <task-progress :progress="currentTaskIndex" :total="tasks?.length ?? 0" />
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
.task-container {
  height: calc(100vh - 600px);
}
</style>
