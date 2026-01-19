<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import matchIcon from '@/utils/matchIcon'
import OptionButtons from '@/components/OptionButtons.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import ConflationProjectTask, { type Project } from './ConflationProjectTask.vue'
import TutorialCompletionCard from './TutorialCompletionCard.vue'
import { isDefined } from '@/utils/common'
import { Collection } from 'ol'
import { GeoJSON } from 'ol/format'
import { boundingExtent, extend } from 'ol/extent'
import { transformExtent } from 'ol/proj'
import { booleanIntersects } from '@turf/boolean-intersects'
import { fetchFeaturesFromRawData } from '@/utils/fetchFeaturesFromRawData'

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
    conflationProjectTask: ConflationProjectTask,
    optionButtons: OptionButtons,
    taskProgress: TaskProgress,
    tutorialCompletionCard: TutorialCompletionCard,
  },
  props: {
    tutorial: Object as PropType<Tutorial>,
    options: Object,
    tasks: Array as PropType<Task[]>,
  },
  data(): {
    currentOptions: Array
    taskIndex: number
    results: Record<string, number>
    userAttempts: number
    answersRevealed: boolean
    taskFeatures: Array | null
    osmFeatures: Array
    mission: string
    intersectingFeatures: Array
    ready: boolean
    taskIsBlue: boolean
  } {
    return {
      currentOptions: [],
      taskIndex: 0,
      results: {},
      userAttempts: 0,
      answersRevealed: false,
      taskFeatures: null,
      osmFeatures: [],
      mission: '',
      intersectingFeatures: [],
      ready: false,
      taskIsBlue: Math.random() < 0.5,
    }
  },
  watch: {
    ready() {
      this.filterOsmFeatures()
    },
    '$i18n.locale'() {
      this.updateMissionAndOptions()
    },
  },
  computed: {
    currentScreen() {
      return this.tutorial?.screens[this.taskIndex]
    },
    task() {
      return this.tasks?.[this.taskIndex]
    },
    hasTasks() {
      return this.tasks.length !== 0
    },
    hasCompletedAllTasks() {
      if (!this.hasTasks) {
        return false
      }

      const maxIndex = this.tasks.length
      return this.taskIndex === maxIndex
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
    defaultOsmFilters() {
      return {
        tags: {
          all_geometry: {
            join_or: {
              building: [],
            },
          },
        },
      }
    },
  },
  methods: {
    nextTask() {
      if (!this.hasCompletedAllTasks) {
        this.taskIndex += 1
        this.userAttempts = 0
        this.answersRevealed = false
        this.filterOsmFeatures()
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
    computeTaskGroupExtent() {
      const features = new Collection()

      this.taskFeatures.forEach((feature) => features.push(feature))

      let extent = boundingExtent([])
      features.forEach((feature) => {
        const geometry = feature.getGeometry()
        if (geometry) {
          extend(extent, geometry.getExtent())
        }
      })

      const extentLonLat = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
      return extentLonLat
    },
    async fetchOSMFeatures() {
      // TODO: accept custom filters
      // const filters = this.project.filter || this.defaultOsmFilters
      const filters = this.defaultOsmFilters
      const taskGroupExtent = this.computeTaskGroupExtent()
      try {
        this.osmFeatures = await fetchFeaturesFromRawData(taskGroupExtent, filters)
        this.ready = true
      } catch (error) {
        console.log(error)
        this.$emit('error')
      }
    },
    filterOsmFeatures() {
      const geoJson = new GeoJSON()
      const options = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }
      const turfTaskFeature = geoJson.writeFeatureObject(
        this.taskFeatures?.[this.taskIndex],
        options,
      )
      const filtered = this.osmFeatures.filter((f) => booleanIntersects(turfTaskFeature, f))
      this.intersectingFeatures = filtered.map((f) => geoJson.readFeature(f, options))
      const numberIntersecting = this.intersectingFeatures.length
      this.updateMissionAndOptions(numberIntersecting)
    },
    makeTaskFeature(task) {
      const geoJson = new GeoJSON()

      const geom = task.geojson
      const feature = { geometry: geom, type: 'Feature' }
      const options = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }

      const newFeature = geoJson.readFeature(feature, options)
      newFeature.setProperties({ taskId: task.taskId })

      return newFeature
    },
    missions() {
      return {
        validate: this.$t('conflationProject.doesTheShapeOutline', {
          feature: this.tutorial?.lookFor,
        }),
        conflate: this.$t('conflationProject.whichShape', { feature: this.tutorial?.lookFor }),
        skip: this.$t('conflationProject.skip'),
      }
    },
    updateMissionAndOptions(numberIntersecting) {
      this.taskIsBlue = Math.random() < 0.5

      switch (numberIntersecting) {
        case 0: {
          this.mission = this.missions().validate
          this.currentOptions = this.options.validate
          break
        }
        case 1: {
          this.mission = this.missions().conflate
          this.currentOptions = this.options.conflate
          break
        }
        default: {
          this.currentOptions = this.options.skip
          this.mission = this.missions().skip
          this.addResult(this.options.skip[0].value)
        }
      }
    },
  },
  emits: ['tutorialComplete'],
  created() {
    this.startTime = new Date().toISOString()
    this.taskId = this.tasks[this.taskIndex].taskId
    this.taskFeatures = this.tasks.map(this.makeTaskFeature)
    this.mission = this.missions().conflate
    this.currentOptions = this.options.conflate
    this.fetchOSMFeatures()
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
    <v-row>
      <v-col>
        <conflation-project-task
          :taskFeature="taskFeatures?.[taskIndex]"
          :project="tutorial"
          :intersectingFeatures="intersectingFeatures"
          :ready="ready"
          :taskIsBlue="taskIsBlue"
          compact
        />
      </v-col>
    </v-row>
    <v-row v-if="options">
      <v-col>
        <option-buttons
          v-if="task?.taskId"
          :options="currentOptions"
          :result="results[task.taskId]"
          :taskId="task.taskId"
          @addResult="addResult"
          :disabled="!ready"
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
        <task-progress :progress="taskIndex" :total="tasks?.length ?? 0" />
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
