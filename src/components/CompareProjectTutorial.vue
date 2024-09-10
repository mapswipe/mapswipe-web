<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { goOnline, onValue } from 'firebase/database'
import { db, getTasksRef } from '@/firebase'
import matchIcon from '@/utils/matchIcon';
import OptionButtons from '@/components/OptionButtons.vue'
import CompareProjectTask from '@/components/CompareProjectTask.vue';
import TaskProgress from '@/components/TaskProgress.vue';

function isDefined<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}

interface Option {
  title: string;
  description: string;
  iconColor: string;
  mdiIcon: string;
  shortKey: number;
  value: number;
}

interface Task {
  taskId: string;
  url?: string;
  urlB?: string;
  referenceAnswer: number;
}

interface Screen {
  title: string;
  icon: string;
  description: string;
}

interface Tutorial {
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
    compareProjectTask: CompareProjectTask,
    optionButtons: OptionButtons,
    taskProgress: TaskProgress,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: Array as PropType<Option[]>
  },
  data(): {
    tasks: Task[],
    currentTaskIndex: number,
    results: Record<string, number>,
    userAttempts: number,
    answersRevealed: boolean,
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
      return message;
    },
    screen() {
      return this.tutorial?.screens[this.currentTaskIndex];
    },
    stepperTasks() {
      return this.tasks?.map((_, i) => `Task ${i + 1}`);
    },
    task() {
      return this.tasks?.[this.currentTaskIndex];
    },
    isLastTask() {
      const maxIndex = this.tasks.length - 1;

      return this.currentTaskIndex === maxIndex;
    },
    answeredCorrectly() {
      const result = this.results[this.task?.taskId];

      return isDefined(result) && result === this.task?.referenceAnswer;
    },
    alertContent() {
      if (this.answeredCorrectly) {
        const icon = this.screen?.success.icon;

        return {
          type: "success" as const,
          title: this.screen?.success.title,
          text: this.screen?.success.description,
          icon: icon ? matchIcon(icon) : icon,
        }
      }

      if (this.userAttempts > 0) {
        const icon = this.screen?.hint.icon;

        return {
          type: undefined,
          title: this.screen?.hint.title,
          text: this.screen?.hint.description,
          icon: icon ? matchIcon(icon) : icon,
        }
      }

      const icon = this.screen?.instructions.icon;

      return {
        type: "info" as const,
        title: this.screen?.instructions.title,
        text: this.screen?.instructions.description,
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
            this.tasks = data;
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
        this.currentTaskIndex += 1;
        this.userAttempts = 0;
        this.answersRevealed = false;
      }
    },
    addResult(value: number) {
      if (!this.answersRevealed) {
        this.userAttempts += 1;
        this.results[this.task.taskId] = value
      }
    },
    showAnswer() {
      this.answersRevealed = true;
      this.results[this.task.taskId] = this.task.referenceAnswer;
    },
  },
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
    <v-row>
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
        <compare-project-task
          v-if="tasks[currentTaskIndex]"
          :task="tasks[currentTaskIndex]"
        />
      </v-col>
    </v-row>
    <v-row>
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

<style scoped></style>
