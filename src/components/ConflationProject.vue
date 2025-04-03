<script lang="ts">
import { defineComponent } from 'vue'
import { Collection } from 'ol'
import createInformationPages from '@/utils/createInformationPages'
import { theme } from '@/plugins/vuetify'
import OptionButtons from '@/components/OptionButtons.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from '@/components/ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import ValidateProjectInstructions from '@/components/ValidateProjectInstructions.vue'
import ValidateProjectTutorial from '@/components/ValidateProjectTutorial.vue'
import ConflationProjectTask from './ConflationProjectTask.vue'
import { GeoJSON } from 'ol/format'
import { boundingExtent, extend, getArea } from 'ol/extent'
import { transformExtent } from 'ol/proj'
import { booleanIntersects } from '@turf/boolean-intersects'

import { extractGeometries } from '@/utils/extractOSMGeometries'

export default defineComponent({
  components: {
    validateProjectInstructions: ValidateProjectInstructions,
    validateProjectTutorial: ValidateProjectTutorial,
    conflationProjectTask: ConflationProjectTask,
    taskProgress: TaskProgress,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
  },
  props: {
    group: {
      type: Object,
      required: true,
    },
    first: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      default() {
        return [
          {
            mdiIcon: 'mdi-shape',
            description: `The blue shape accurately outlines the building.`,
            iconColor: '#1976D2',
            shortkey: 1,
            title: 'Blue',
            value: 1,
          },
          {
            mdiIcon: 'mdi-shape',
            description: `The red shape accurately outlines the building.`,
            iconColor: '#D32F2F',
            shortkey: 2,
            title: 'Red',
            value: 0,
          },
          {
            mdiIcon: 'mdi-close-thick',
            description: `Neither the blue nor the red shape accurately outline a building.`,
            iconColor: '#616161',
            title: 'None',
            shortkey: 3,
            value: 2,
          },
        ]
      },
    },
    project: {
      type: Object,
      required: true,
    },
    tasks: {
      type: Array,
      required: true,
    },
    tutorial: {
      type: Object,
      require: false,
    },
  },
  data() {
    return {
      arrowKeys: true,
      center: [0, 0],
      results: {},
      startTime: null,
      taskFeatures: null,
      osmFeatureCollection: new Collection(),
      intersectingFeatures: [],
      ready: false,
      taskId: undefined,
      taskIndex: 0,
      transparent: false,
      zoom: 3,
    }
  },
  inject: {
    logMappingStarted: 'logMappingStarted',
    saveResults: 'saveResults',
  },
  watch: {
    ready() {
      this.filterOsmFeatures()
    },
  },
  computed: {
    colors() {
      const colors = theme
      return colors
    },
    mission() {
      const message = this.$t('conflationProject.whichShape', {
        feature: this.project?.lookFor,
      })
      return message
    },
  },
  methods: {
    addResult(value) {
      this.results[this.taskId] = value
    },
    back() {
      if (!this.taskIndex <= 0) {
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
        this.filterOsmFeatures()
      }
    },
    createInformationPages,
    // currently no fallback information pages defined, same here
    createFallbackInformationPages() {
      return undefined
    },
    forward() {
      if (this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
        this.filterOsmFeatures()
      }
    },
    isAnswered() {
      const result = this.results[this.taskId]
      const defined = result !== undefined
      return defined
    },
    // Use this when the overall task group extent is not too large
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

      console.log(getArea(extent))
      const extentLonLat = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')

      console.log(extentLonLat)

      return extentLonLat
    },
    /* TODO: fetch OSM based on array of individual task extents when overall task group extent is too large?
    computeTaskExtent() {
      const feature = this.taskFeatures?.[this.taskIndex]
      const geometry = feature.getGeometry()
      const extent = geometry.getExtent()
      
      console.log(extent)
      console.log( getArea(transformExtent(extent, 'EPSG:4326', 'EPSG:3857' )))

      return extent
    },
    */
    async fetchOSMFeatures() {
      try {
        this.osmFeatureCollection.clear()
        const geoJson = new GeoJSON()
        const taskGroupExtent = this.computeTaskGroupExtent()
        const osmGeometries = await extractGeometries(
          taskGroupExtent.toString(),
          'building=* and geometry:polygon',
          '2024-03-25',
        )

        osmGeometries.forEach((osmGeom) => {
          const osmFeature = geoJson.readFeature({ geometry: osmGeom, type: 'Feature' })
          this.osmFeatureCollection.push(osmFeature)
        })

        this.ready = true
      } catch (error) {
        console.error('Error fetching OSM features:', error)
      }
    },
    filterOsmFeatures() {
      const geoJson = new GeoJSON()
      const options = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }
      const turfOsmFeatures = this.osmFeatureCollection
        .getArray()
        .map((f) => geoJson.writeFeatureObject(f))
      const turfTaskFeature = geoJson.writeFeatureObject(
        this.taskFeatures?.[this.taskIndex],
        options,
      )
      const filtered = turfOsmFeatures.filter((f) => booleanIntersects(turfTaskFeature, f))
      this.intersectingFeatures = filtered.map((f) => geoJson.readFeature(f, options))
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
  },
  emits: ['created'],
  created() {
    this.startTime = new Date().toISOString()
    this.taskId = this.tasks[this.taskIndex].taskId
    this.taskFeatures = this.tasks.map(this.makeTaskFeature)
    this.fetchOSMFeatures()
    this.$emit('created')
    this.logMappingStarted(this.project.projectType)
  },
})
</script>

<template>
  <project-header :mission="mission" :title="project.projectTopic">
    <v-btn
      :title="$t('conflationProject.toggleOpacity')"
      :icon="'mdi-eye'.concat(transparent ? '-off' : '')"
      @click="transparent = !transparent"
      color="primary"
    />
    <v-btn
      :title="$t('tileMap.resetView')"
      icon="mdi-fit-to-screen-outline"
      @click="$refs['conflation-project-task']?.fitView()"
      color="primary"
    />
    <project-info
      ref="projectInfo"
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
      @toggle-dialog="arrowKeys = !arrowKeys"
    >
      <template #instructions>
        <validate-project-instructions :mission="mission" :options="options" />
      </template>
      <template #tutorial>
        <validate-project-tutorial
          :tutorial="tutorial"
          :options="options"
          @tutorialComplete="$refs.projectInfo?.toggleDialog"
        />
      </template>
    </project-info>
  </project-header>
  <v-container class="ma-0 pa-0">
    <conflation-project-task
      ref="conflation-project-task"
      :taskFeature="taskFeatures?.[taskIndex]"
      :project="project"
      :intersectingFeatures="intersectingFeatures"
      :transparent="transparent"
      :ready="ready"
    />
  </v-container>
  <option-buttons
    v-if="taskId"
    :options="options"
    :result="results[taskId]"
    :taskId="taskId"
    @addResult="addResult"
    :disabled="!ready"
  />
  <v-toolbar color="white" density="compact" extension-height="20" extended>
    <v-spacer />
    <v-btn
      :title="$t('validateProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskIndex <= 0"
      @click="back"
      v-shortkey.once="[arrowKeys ? 'arrowleft' : '']"
      @shortkey="back"
    />
    <v-btn
      :title="$t('projectView.saveResults')"
      icon="mdi-content-save"
      color="primary"
      :disabled="Object.keys(results).length < tasks.length"
      @click="saveResults(results, startTime)"
    />
    <v-btn
      :title="$t('validateProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="!isAnswered() || taskIndex + 1 === tasks.length"
      @click="forward"
      v-shortkey.once="[arrowKeys ? 'arrowright' : '']"
      @shortkey="forward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex + isAnswered()" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
