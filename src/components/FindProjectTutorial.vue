<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import matchIcon from '@/utils/matchIcon'
import TaskProgress from '@/components/TaskProgress.vue'
import FindProjectTask, { type Option } from '@/components/FindProjectTask.vue'
import TutorialCompletionCard from './TutorialCompletionCard.vue'
import { isDefined } from '@/utils/common'

interface MappedOption extends Option {
  nextOptionKey: number
}

interface Task {
  taskId: string
  url: string
  screen: number
  referenceAnswer: number
}

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
    taskProgress: TaskProgress,
    findProjectTask: FindProjectTask,
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
    selectedTasks: Record<string, boolean>
    userAttempts: number
    answersRevealed: boolean
  } {
    return {
      currentTaskIndex: 0,
      results: {},
      selectedTasks: {},
      userAttempts: 0,
      answersRevealed: false,
    }
  },
  computed: {
    optionMap() {
      const maxOptionIndex = this.options.length - 1

      return this.options
        .map((option, index) => ({
          ...option,
          nextOptionKey:
            index === maxOptionIndex ? this.options[0].value : this.options[index + 1].value,
        }))
        .reduce(
          (acc, val) => {
            acc[val.value] = val

            return acc
          },
          {} as Record<number, MappedOption>,
        )
    },
    mission() {
      const message = isDefined(this.tutorial?.projectInstruction) 
        ? this.tutorial.projectInstruction
        : this.$t('projectView.youAreLookingFor', { lookFor: this.tutorial.lookFor })
      return message
    },
    currentScreen() {
      // NOTE: this should be extracted from the `screen` property of current task
      return this.tutorial?.screens[this.currentTaskIndex]
    },
    taskList() {
      if (!this.tasks) {
        return []
      }

      return this.tasks.filter(({ screen }) => screen === this.currentTaskIndex + 1)
    },
    hasTasks() {
      return this.tasks.length !== 0
    },
    hasCompletedAllTasks() {
      if (!this.hasTasks) {
        return false
      }

      const maxIndex = this.tutorial?.screens.length ?? 1
      return this.currentTaskIndex === maxIndex
    },
    answeredCorrectly() {
      if (this.tasks.length === 0) {
        return false
      }

      if (this.hasCompletedAllTasks) {
        return true
      }

      if (!this.taskList || this.taskList.length === 0) {
        return false
      }

      const hasWrongAnswer = this.taskList.some(
        ({ taskId, referenceAnswer }) => referenceAnswer !== this.results[taskId],
      )

      return !hasWrongAnswer
    },
    alertContent() {
      if (!this.currentScreen) {
        return undefined
      }

      const { instructions, success, hint } = this.currentScreen

      if (!this.answersRevealed && this.answeredCorrectly && success) {
        const icon = success.icon

        return {
          type: 'success' as const,
          title: success.title,
          text: success.description,
          icon: icon ? matchIcon(icon) : undefined,
        }
      }

      if (this.answersRevealed && hint) {
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
    fillResults() {
      this.results = this.tasks.reduce(
        (acc, val) => {
          // Fill all the results with initial value
          acc[val.taskId] = this.options[0].value

          return acc
        },
        {} as Record<string, number>,
      )
    },
    nextTask() {
      if (!this.hasCompletedAllTasks) {
        if (this.hasCompletedAllTasks) {
          return
        }

        this.selectedTasks = {}
        this.currentTaskIndex += 1
        this.userAttempts = 0
        this.answersRevealed = false
      }
    },
    getNextValueForTask(taskId: string) {
      const currentResult = this.results[taskId]

      if (!isDefined(currentResult)) {
        return this.options[0].value
      }

      const newValue = this.optionMap[this.optionMap[currentResult].nextOptionKey].value

      return newValue
    },
    setResult(taskId: string, newValue: number) {
      this.results[taskId] = newValue
    },
    updateResult(taskId: string) {
      if (!this.answersRevealed) {
        this.userAttempts += 1
        const newValue = this.getNextValueForTask(taskId)
        this.results[taskId] = newValue
      }
    },
    handleTileClicked(taskId: string) {
      const selectedTaskKeys = Object.keys(this.selectedTasks).filter(
        (taskKey) => !!this.selectedTasks[taskKey],
      )

      const hasSomeSelectedItem = selectedTaskKeys.length > 0
      const isTaskFromSelectedItem =
        selectedTaskKeys.findIndex((taskKey) => taskKey === taskId) !== -1

      if (hasSomeSelectedItem) {
        if (isTaskFromSelectedItem) {
          const newValue = this.getNextValueForTask(taskId)
          selectedTaskKeys.forEach((taskKey) => {
            this.setResult(taskKey, newValue)
          })
        }
      } else {
        this.updateResult(taskId)
      }
    },
    handleTileSelected(newValue: boolean, taskId: string) {
      this.selectedTasks[taskId] = newValue
    },
    showAnswer() {
      this.answersRevealed = true
      this.taskList.forEach((task) => {
        this.results[task.taskId] = task.referenceAnswer
      })
    },
  },
  emits: ['tutorialComplete'],
  mounted() {
    this.fillResults()
  },
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
    <v-row justify="center">
      <v-col cols="auto">
        <div class="image-grid">
          <find-project-task
            v-for="task in taskList"
            :key="task.taskId"
            :task="task"
            :optionMap="optionMap"
            :selected="selectedTasks[task.taskId]"
            :value="results[task.taskId]"
            @updateValue="handleTileClicked"
            @updateSelected="handleTileSelected"
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
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, max(8rem, calc(30vh - 6rem)));
  grid-template-rows: repeat(3, 1fr);
  grid-auto-flow: column;
}
</style>
