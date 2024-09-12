<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { goOnline, onValue } from 'firebase/database'
import { db, getTasksRef, getGroupsRef } from '@/firebase'
import matchIcon from '@/utils/matchIcon'
import OptionButtons from '@/components/OptionButtons.vue'
import { type Option } from '@/components/OptionButtons.vue'
import CompareProjectTask, { type Task } from '@/components/CompareProjectTask.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import { decompressTasks } from '@/utils/tasks'
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
    userAttempts: number
    answersRevealed: boolean
  } {
    return {
      tasks: [],
      currentTaskIndex: 0,
      results: {},
      userAttempts: 0,
      answersRevealed: false,
    }
  },
  computed: {
    instructionMessage() {
      const message = this.$t('compareProject.lookForChange', { lookFor: this.tutorial?.lookFor })
      return message
    },
    currentScreen() {
      // NOTE: this should be extracted from the `screen` property of current task
      return this.tutorial?.screens[this.currentTaskIndex]
    },
    currentTask() {
      return this.tasks?.[this.currentTaskIndex]
    },
    isLastTask() {
      const maxIndex = this.tasks.length - 1

      return this.currentTaskIndex === maxIndex
    },
    answeredCorrectly() {
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
    fetchTutorialGroups() {
      if (this.tutorial?.projectId) {
        onValue(
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
          },
          (error) => {
            console.error('Error fetching tasks for the tutorial', error)
          },
          { onlyOnce: true },
        )
      }
    },
    nextTask() {
      if (!this.isLastTask) {
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
  mounted() {
    goOnline(db)
    this.fetchTutorialGroups()
  },
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <div>
          {{ instructionMessage }}
        </div>
      </v-col>
    </v-row>
    <v-row v-if="alertContent">
      <v-col>
        <v-alert
          density="compact"
          border="start"
          variant="tonal"
          :type="alertContent.type"
          :title="alertContent.title"
          :text="alertContent.text"
          :icon="alertContent.icon"
        />
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
    <v-row>
      <v-col>
        <task-progress :progress="currentTaskIndex" :total="tasks?.length ?? 0" />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="auto">
        <v-btn
          v-if="userAttempts > 1 && !answeredCorrectly && !answersRevealed"
          @click="showAnswer"
        >
          Show answer
        </v-btn>
        <v-btn v-if="!isLastTask && answeredCorrectly" @click="nextTask"> Next task </v-btn>
        <v-btn v-if="isLastTask && answeredCorrectly" @click="$emit('tutorialComplete')">
          Start mapping
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
