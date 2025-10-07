<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import matchIcon from '@/utils/matchIcon'
import OptionButtons from '@/components/OptionButtons.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import ValidateProjectTask, { type Project } from './ValidateProjectTask.vue'
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
  geojson: object
  geometry: string
  properties: {
    reference: number
    screen: number
  }
  screen: number
  taskId: string
}

interface Screen {
  title: string
  icon: string
  description: string
}

interface Tutorial extends Project {
  projectId: string
  name: string
  lookFor?: string
  projectInstruction?: string
  screens: {
    instructions: Screen

    // FIXME: we may not have success and hint for this project type
    hint: Screen
    success: Screen
  }[]
}

export default defineComponent({
  components: {
    validateProjectTask: ValidateProjectTask,
    optionButtons: OptionButtons,
    taskProgress: TaskProgress,
    tutorialCompletionCard: TutorialCompletionCard,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: Array as PropType<Option[]>,
    tasks: Array as PropType<Task[]>,
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
        : this.$t('validateProject.doesTheShapeOutline', {
            feature: this.tutorial?.lookFor,
          })
      return message
    },
    currentScreen() {
      return this.tutorial?.screens[this.currentTaskIndex]
    },
    task() {
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

      const result = this.results[this.task?.taskId]
      return isDefined(result) && result === this.task?.properties.reference
    },
    alertContent() {
      if (!this.currentScreen) {
        return undefined
      }

      // FIXME: we may not have success and hint for this project type
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
        this.results[this.task.taskId] = value
      }
    },
    showAnswer() {
      this.answersRevealed = true
      this.results[this.task.taskId] = this.task.properties?.reference
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
        <validate-project-task
          v-if="tasks[currentTaskIndex] && tutorial"
          :task="tasks[currentTaskIndex]"
          :project="tutorial"
          compact
        />
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

<style scoped></style>
