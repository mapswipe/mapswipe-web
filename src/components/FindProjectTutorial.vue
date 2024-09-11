<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { goOnline, onValue } from 'firebase/database'
import { db, getTasksRef } from '@/firebase'

import { decompressTasks } from '@/utils/tasks';
import matchIcon from '@/utils/matchIcon';

import TaskProgress from '@/components/TaskProgress.vue';
import FindProjectTask, { type Option } from '@/components/FindProjectTask.vue'
import { isDefined } from '@/utils/common';

interface MappedOption extends Option {
  nextOptionKey: number;
}

interface Task {
  taskId: string;
  url: string;
  screen: number;
  referenceAnswer: number;
}

interface Screen {
  title: string;
  icon: string;
  description: string;
}

export interface Tutorial {
  projectId: string;
  name: string;
  lookFor?: string;
  screens: {
    hint: Screen;
    instructions: Screen;
    success: Screen;
  }[];
}

export default defineComponent({
  components: {
    taskProgress: TaskProgress,
    findProjectTask: FindProjectTask,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: {
      type: Array as PropType<Option[]>,
      required: true,
    },
  },
  data(): {
    tasks: Task[],
    currentTaskIndex: number,
    results: Record<string, number>,
    selectedTasks: Record<string, boolean>,
    userAttempts: number,
    answersRevealed: boolean,
  } {
    return {
      tasks: [],
      currentTaskIndex: 0,
      results: {},
      selectedTasks: {},
      userAttempts: 0,
      answersRevealed: false,
    }
  },
  computed: {
    optionMap() {
      const maxOptionIndex = this.options.length - 1;

      return this.options.map(
        (option, index) => ({
          ...option,
          nextOptionKey: index === maxOptionIndex
            ? this.options[0].value
            : this.options[index + 1].value
        })
      ).reduce((acc, val) => {
        acc[val.value] = val;

        return acc;
      }, {} as Record<number, MappedOption>);
    },
    instructionMessage() {
      const message = this.$t('compareProject.lookForChange', { lookFor: this.tutorial?.lookFor })
      return message;
    },
    currentScreen() {
      // NOTE: this should be extracted from the `screen` property of current task
      return this.tutorial?.screens[this.currentTaskIndex];
    },
    taskList() {
      if (!this.tasks) {
        return [];
      }

      return this.tasks.filter(
        ({ screen }) => screen === this.currentTaskIndex + 1
      );
    },
    isLastTask() {
      const maxIndex = (this.tutorial?.screens.length ?? 1) - 1;

      return this.currentTaskIndex === maxIndex;
    },
    answeredCorrectly() {
      if (!this.taskList || this.taskList.length === 0) {
        return false;
      }

      const hasWrongAnswer = this.taskList.some(
        ({ taskId, referenceAnswer }) => referenceAnswer !== this.results[taskId]
      );

      return !hasWrongAnswer;
    },
    alertContent() {
      if (!this.currentScreen) {
        return undefined;
      }

      const {
        instructions,
        success,
        hint,
      } = this.currentScreen;

      if (!this.answersRevealed && this.answeredCorrectly && success) {
        const icon = success.icon;

        return {
          type: "success" as const,
          title: success.title,
          text: success.description,
          icon: icon ? matchIcon(icon) : icon,
        }
      }

      if (this.answersRevealed && hint) {
        const icon = hint.icon;

        return {
          type: undefined,
          title: hint.title,
          text: hint.description,
          icon: icon ? matchIcon(icon) : icon,
        }
      }

      if (!instructions) {
        return undefined;
      }

      const icon = instructions.icon;

      return {
        type: "info" as const,
        title: instructions.title,
        text: instructions.description,
        icon: icon ? matchIcon(icon) : icon,
      }
    },
  },
  methods: {
    fetchTutorialProject() {
      if (this.tutorial?.projectId) {
        onValue(
          // FIXME: verify group id
          getTasksRef(this.tutorial.projectId, '101'),
          (snapshot) => {
            const data = snapshot.val();
            this.tasks = decompressTasks(data);
            this.results = this.tasks.reduce(
              (acc, val) => {
                // Fill all the result with initial value
                acc[val.taskId] = this.options[0].value;

                return acc;
              },
              {} as Record<string, number>,
            );
          },
          (error) => {
            console.error('Error fetching tasks for the tutorial', error);
          },
          { onlyOnce: true },
        );
      }
    },
    nextTask() {
      if (!this.isLastTask) {
        if (this.isLastTask) {
          return;
        }

        this.selectedTasks = {};
        this.currentTaskIndex += 1;
        this.userAttempts = 0;
        this.answersRevealed = false;
      }
    },
    updateResult(taskId: string) {
      if (!this.answersRevealed) {
        this.userAttempts += 1;
        const currentResult = this.results[taskId];

        if (!isDefined(currentResult)) {
          this.results[taskId] = this.options[0].value;
          return;
        }

        const newValue = this.optionMap[
          this.optionMap[currentResult].nextOptionKey
        ].value;

        this.results[taskId] = newValue;
      }
    },
    handleTileClicked(taskId: string) {
      this.updateResult(taskId);
    },
    handleTileSelected(newValue: boolean, taskId: string) {
      this.selectedTasks[taskId] = newValue;
    },
    showAnswer() {
      this.answersRevealed = true;
      this.taskList.forEach((task) => {
        this.results[task.taskId] = task.referenceAnswer;
      });
    },
  },
  emits: ['tutorialComplete'],
  mounted() {
    goOnline(db);
    this.fetchTutorialProject();
  }
});
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
    <v-row justify="center">
      <v-col md="6">
        <div class="image-grid">
          <find-project-task
            v-for="(task) in taskList" :key="task.taskId"
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
    <v-row>
      <v-col>
        <task-progress :progress="currentTaskIndex" :total="tutorial?.screens.length ?? 0" />
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
        <v-btn
          v-if="!isLastTask && answeredCorrectly"
          @click="nextTask"
        >
          Next task
        </v-btn>
        <v-btn
          v-if="isLastTask && answeredCorrectly"
          @click="$emit('tutorialComplete')"
        >
          Start mapping
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-auto-flow: column;
}
</style>
