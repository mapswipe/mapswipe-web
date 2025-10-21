<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import matchIcon from '@/utils/matchIcon'
import OptionButtons from '@/components/OptionButtons.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import StreetProjectTask from '@/components/StreetProjectTask.vue'
import StreetProjectTaskPanoramax from '@/components/StreetProjectTaskPanoramax.vue'
import TutorialCompletionCard from './TutorialCompletionCard.vue'
import { isDefined } from '@/utils/common'

interface Option {
  title: string
  description: string
  iconColor: string
  mdiIcon: string
  shortKey: number
  value: number
}

interface Task {
  taskId: string
  screen: number
  referenceAnswer: number
}

interface Screen {
  title: string
  icon: string
  description: string
}

interface Tutorial {
  projectId: string
  name: string
  lookFor?: string
  screens: {
    hint: Screen
    instructions: Screen
    success: Screen
  }[]
}

export default defineComponent({
  components: {
    StreetProjectTask,
    StreetProjectTaskPanoramax,
    OptionButtons,
    TaskProgress,
    TutorialCompletionCard,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: Array as PropType<Option[]>,
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
    isLoading: boolean
    trigger: number
  } {
    return {
      currentTaskIndex: 0,
      results: {},
      userAttempts: 0,
      answersRevealed: false,
      isLoading: false,
      trigger: 0,
      taskId: undefined,
    }
  },
  computed: {
    mission() {
      const message = this.$t('projectView.youAreLookingFor', { lookFor: this.tutorial.lookFor })
      return message
    },
    currentScreen() {
      return this.tutorial?.screens[this.currentTaskIndex]
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

      const result = this.results[this.taskId]
      return isDefined(result) && result === this.tasks?.[this.currentTaskIndex].referenceAnswer
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
        this.taskId = this.tasks[this.currentTaskIndex]?.taskId
        this.userAttempts = 0
        this.answersRevealed = false
      }
    },
    addResult(value: number) {
      if (!this.answersRevealed) {
        this.userAttempts += 1
        this.results[this.taskId] = value
      }
    },
    showAnswer() {
      this.answersRevealed = true
      this.results[this.taskId] = this.tasks?.[this.currentTaskIndex].referenceAnswer
    },
  },
  emits: ['tutorialComplete'],
  mounted() {
    this.taskId = this.tasks?.[this.currentTaskIndex].taskId
  },
})
</script>

<template>
  <v-container>
    <!-- Instruction Message for the Tutorial -->
    <v-row v-if="!hasCompletedAllTasks">
      <v-col>
        <div>
          {{ mission }}
        </div>
      </v-col>
    </v-row>

    <!-- Alert Content (Success/Hint/Instruction) -->
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
            <!-- Show Answer Button -->
            <v-btn
              v-if="userAttempts > 1 && !answeredCorrectly && !answersRevealed"
              @click="showAnswer"
            >
              {{ $t('projectTutorial.showAnswer') }}
            </v-btn>
            <!-- Next Task Button -->
            <v-btn v-if="!hasCompletedAllTasks && answeredCorrectly" @click="nextTask">
              {{ $t('projectTutorial.nextTask') }}
            </v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col>
        <street-project-task-panoramax
          v-if="taskId && tutorial && tutorial.tileServer?.name == 'panoramax'"
          :key="taskId"
          :taskId="taskId"
          :endpoint="tutorial.tileServer?.url"
          :containerId="'panoramax_tutorial'"
          @dataloading="(e) => (isLoading = e)"
          style="position: relative; height: calc(70vh - 390px)"
        />
        <street-project-task
          v-else-if="taskId && tutorial"
          :key="taskId"
          :taskId="taskId"
          :containerId="'mapillary_tutorial'"
          @dataloading="(e) => (isLoading = e.loading)"
          style="position: relative; height: calc(70vh - 390px)"
        />
      </v-col>
    </v-row>
    <v-row v-if="options">
      <v-col>
        <option-buttons
          v-if="taskId"
          :disabled="isLoading"
          :options="options"
          :result="results[taskId]"
          :taskId="taskId"
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
