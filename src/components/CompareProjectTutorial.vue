<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import matchIcon from '@/utils/matchIcon'
import OptionButtons from '@/components/OptionButtons.vue'
import { type Option } from '@/components/OptionButtons.vue'
import CompareProjectTask, { type Task } from '@/components/CompareProjectTask.vue'
import TutorialCompletionCard from './TutorialCompletionCard.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import { isDefined } from '@/utils/common'

interface Screen {
  title: string
  icon: string
  description: string
}

export interface Tutorial {
  projectId: string
  name: string
  lookFor?: string
  projectInstruction?: string
  screens: {
    hint: Screen
    instructions: Screen
    success: Screen
  }[]
}

export default defineComponent({
  components: {
    compareProjectTask: CompareProjectTask,
    optionButtons: OptionButtons,
    taskProgress: TaskProgress,
    tutorialCompletionCard: TutorialCompletionCard,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: {
      type: Array as PropType<Option[]>,
      required: true,
    },
    tasks: {
      type: Array as PropType<Task[]>,
      required: true,
    },
  },
  data(): {
    currentTaskIndex: number
    results: Record<string, number>
    userAttempts: number
    answersRevealed: boolean
  } {
    return {
      currentTaskIndex: 0,
      results: {},
      userAttempts: 0,
      answersRevealed: false,
    }
  },
  computed: {
    mission() {
      const message = isDefined(this.tutorial?.projectInstruction)
        ? this.tutorial.projectInstruction
        : this.$t('projectView.youAreLookingFor', { lookFor: this.tutorial?.lookFor })
      return message
    },
    currentScreen() {
      // NOTE: this should be extracted from the `screen` property of current task
      return this.tutorial?.screens[this.currentTaskIndex]
    },
    currentTask() {
      return this.tasks?.[this.currentTaskIndex]
    },
    hasTasks() {
      return this.tasks.length !== 0
    },
    hasCompletedAllTasks() {
      if (!this.hasTasks) {
        return false
      }

      const maxIndex = this.tasks.length
      return this.currentTaskIndex === maxIndex
    },
    answeredCorrectly() {
      if (!this.hasTasks) {
        return false
      }

      if (this.hasCompletedAllTasks) {
        return true
      }

      const result = this.results[this.currentTask?.taskId]
      return isDefined(result) && result === this.currentTask?.referenceAnswer
    },
    alertContent() {
      if (!this.currentScreen) {
        return undefined
      }

      const { instructions, success, hint } = this.currentScreen

      if (this.answeredCorrectly && success) {
        const icon = success.icon

        return {
          type: 'success' as const,
          title: success.title,
          text: success.description,
          icon: icon ? matchIcon(icon) : undefined,
        }
      }

      if (this.userAttempts > 0 && hint) {
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
    },
  },
  methods: {
    nextTask() {
      if (!this.hasCompletedAllTasks) {
        this.currentTaskIndex += 1
        this.userAttempts = 0
        this.answersRevealed = false
      }
    },
    addResult(value: number) {
      if (!this.answersRevealed) {
        this.userAttempts += 1
        this.results[this.currentTask.taskId] = value
      }
    },
    showAnswer() {
      this.answersRevealed = true
      this.results[this.currentTask.taskId] = this.currentTask.referenceAnswer
    },
  },
  emits: ['tutorialComplete'],
})
</script>

<template>
  <v-container>
    <v-row v-if="!hasCompletedAllTasks">
      <v-col>
        <div>
          {{ mission }}
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
        <compare-project-task v-if="tasks[currentTaskIndex]" :task="tasks[currentTaskIndex]" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <option-buttons
          v-if="currentTask?.taskId"
          :options="options"
          :result="results[currentTask.taskId]"
          :taskId="currentTask.taskId"
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

<style scoped></style>
