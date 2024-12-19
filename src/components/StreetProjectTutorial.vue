<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { goOnline, onValue } from 'firebase/database'
import { db, getTasksRef, getGroupsRef } from '@/firebase'

import { decompressTasks } from '@/utils/tasks'
import matchIcon from '@/utils/matchIcon'

import TaskProgress from '@/components/TaskProgress.vue'
import TutorialStreetProjectTask, { type Option } from '@/components/StreetProjectTask.vue'
import TutorialCompletionCard from './TutorialCompletionCard.vue'
import { isDefined } from '@/utils/common'
import optionButtons from '@/components/OptionButtons.vue'


interface MappedOption extends Option {
  nextOptionKey: number
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

export interface Tutorial {
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
    optionButtons,
    TaskProgress,
    TutorialStreetProjectTask,
    TutorialCompletionCard,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: {
      type: Array as PropType<Option[]>,
      required: true,
    },
  },
  data(): {
    tasks: Task[]
    currentTaskIndex: number
    results: Record<string, number>
    userAnswer: number
    userAttempts: number
    answersRevealed: boolean
  } {
    return {
      tasks: [],
      currentTaskIndex: 0,
      results: {},
      userAnswer: undefined,
      userAttempts: 0,
      answersRevealed: false,
      isLoading: false,
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
    instructionMessage() {
      const message = this.$t('compareProject.lookForChange', { lookFor: this.tutorial?.lookFor })
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

      const hasWrongAnswer = this.userAnswer !== this.results[this.tasks[this.currentTaskIndex]?.taskId]
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
    addResult(value) {
      this.userAnswer = value

      this.updateResult(value)
    },
    fetchTutorialGroups() {
      if (this.tutorial?.projectId) {
        onValue(
          // FIXME: verify group id
          getGroupsRef(this.tutorial.projectId),
          (snapshot) => {
            const data = snapshot.val()
            const groupKeys = Object.keys(data)
            this.fetchTutorialProject(groupKeys[0])
          },
          (error) => {
            console.error('Error fetching tasks for the tutorial', error)
          },
          { onlyOnce: true },
        )
      }
    },
    fetchTutorialProject(groupId: string | undefined) {
      if (this.tutorial?.projectId && groupId) {
        onValue(
          getTasksRef(this.tutorial.projectId, groupId),
          (snapshot) => {
            const data = snapshot.val()
            this.tasks = decompressTasks(data)
            if (this.tasks) {
              this.tasks.forEach((task, index) => {
                console.log(task)
                if (task.referenceAnswer !== undefined) {
                  this.results[task.taskId] = task.referenceAnswer;
                }
              });
            }
          },
          (error) => {
            console.error('Error fetching tasks for the tutorial', error)
          },
          { onlyOnce: true },
        )
      }
    },
    back() {
      if (!this.currentTaskIndex <= 0) {
        this.currentTaskIndex -= 1
      }
    },
    nextTask() {
      if (!this.hasCompletedAllTasks) {
        if (this.hasCompletedAllTasks) {
          return
        }

        this.userAnswer = undefined
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
    updateResult(taskId: string) {
      if (!this.answersRevealed) {
        this.userAttempts += 1
        const newValue = this.getNextValueForTask(taskId)
        this.results[taskId] = newValue
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
    goOnline(db)
    this.fetchTutorialGroups()
    // this.fetchTutorialProject();
  },
})
</script>

<template>
  <v-container>
    <!-- Instruction Message for the Tutorial -->
    <v-row v-if="!hasCompletedAllTasks">
      <v-col>
        <div>
          {{ instructionMessage }}
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

    <!-- Loading Spinner if No Tasks Are Available -->
    <v-row v-if="!hasTasks" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate />
      </v-col>
    </v-row>

    <!-- Task Grid (Replaced with StreetTask component) -->
    <v-row justify="center">
      <v-col cols="auto">
        <tutorial-street-project-task
          v-for="task in taskList"
          :key="task.taskId"
          :taskId="task.taskId"
          :option-map="optionMap"
          :containerId="'mapillary_tutorial'"
          @dataloading="handleDataLoading"
        />
        <option-buttons
          v-if="true"
          :disabled="false"
          :options="options"
          :taskId="taskId ? taskId.toString() : 'defaultTaskId'"
          @addResult="addResult"/>
      </v-col>
      <v-toolbar color="white" extension-height="20" density="compact" extended>
        <v-spacer />
        <v-btn
          :title="$t('streetProject.moveLeft')"
          icon="mdi-chevron-left"
          color="secondary"
          :disabled="currentTaskIndex <= 0"
          @click="back"
          v-shortkey.once="[arrowKeys ? 'arrowleft' : '']"
          @shortkey="back"
        />
        <v-btn
          :title="$t('streetProject.moveRight')"
          icon="mdi-chevron-right"
          color="secondary"
          :disabled="isLoading || !answersRevealed && !answeredCorrectly || hasCompletedAllTasks"
          @click="nextTask"
          v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
          @shortkey="nextTask"
        />
        <v-spacer />
<!--        <template #extension>-->
<!--          <task-progress :progress="taskIndex + isAnswered()" :total="tasks.length" />-->
<!--        </template>-->
      </v-toolbar>
    </v-row>


    <!-- Task Progress Display -->
    <v-row v-if="hasTasks && !hasCompletedAllTasks">
      <v-col>
        <task-progress :progress="currentTaskIndex" :total="tutorial?.screens.length ?? 0" />
      </v-col>
    </v-row>

    <!-- Completion Card when All Tasks Are Done -->
    <v-row v-if="hasCompletedAllTasks">
      <v-col>
        <tutorial-completion-card @on-start-mapping-click="$emit('tutorialComplete')" />
      </v-col>
    </v-row>
  </v-container>
</template>
