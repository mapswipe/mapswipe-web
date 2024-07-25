<script lang="ts">
import { defineComponent } from 'vue'
import createInformationPages from '@/utils/createInformationPages'
import hex2rgb from '@/utils/hex2rgb'
import makeXyzUrl from '@/utils/makeXyzUrl'
import { theme } from '@/plugins/vuetify'
import OptionButtons from '@/components/OptionButtons.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import ProjectInfo from '@/components/ProjectInfo.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import ValidateProjectInstructions from '@/components/ValidateProjectInstructions.vue'
import { GeoJSON } from 'ol/format'
import { Collection } from 'ol'

export default defineComponent({
  components: {
    validateProjectInstructions: ValidateProjectInstructions,
    taskProgress: TaskProgress,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
    projectInfo: ProjectInfo,
  },
  props: {
    group: {
      type: Object,
      require: true,
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
            mdiIcon: 'mdi-check',
            description: 'The shape correctly outlines a building.',
            iconColor: 'green',
            shortkey: 1,
            title: 'Yes',
            value: 1,
          },
          {
            mdiIcon: 'mdi-cancel',
            description: "The shape doesn't correctly outline a building in the image.",
            iconColor: 'red',
            shortkey: 2,
            title: 'No',
            value: 0,
          },
          {
            mdiIcon: 'mdi-flag-outline',
            description: 'Building outline correct, but not aligned with imagery.',
            iconColor: 'orange',
            shortkey: 3,
            title: 'Offset',
            value: 3,
          },
          {
            mdiIcon: 'mdi-minus',
            description: 'I am not sure.',
            iconColor: 'gray',
            title: 'Not sure',
            shortkey: 4,
            value: 2,
          },
        ]
      },
    },
    project: {
      type: Object,
      require: true,
    },
    tasks: {
      type: Array,
      require: true,
    },
    tutorial: {
      type: Object,
      require: false,
    },
  },
  data() {
    return {
      center: [0, 0],
      results: {},
      startTime: null,
      taskFeatures: new Collection(),
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
  computed: {
    colors() {
      const colors = theme
      return colors
    },
    instructionMessage() {
      const message = this.$t('validateProject.doesTheShapeOutline', {
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
        this.updateTaskFeature()
      }
    },
    createInformationPages,
    createFallbackInformationPages(tutorial) {
      if (tutorial.lookFor) {
        return [
          {
            blocks: [
              {
                blockNumber: 1,
                blockType: 'text',
                textDescription: "You'll see a shape on an image. Use the buttons to answer.",
              },
              {
                blockNumber: 2,
                blockType: 'text',
                textDescription: 'Does the shape outline a ${tutorial.lookFor}?',
              },
              {
                blockNumber: 3,
                blockType: 'text',
                textDescription:
                  "Every time you select an option, you'll be shown a new shape and image.",
              },
            ],
            pageNumber: 1,
            title: 'What to look for',
          },
        ]
      } else {
        return undefined
      }
    },
    fitView(duration = 600, delay = 100) {
      const map = this.$refs.map.map
      const mapView = this.$refs.mapView
      const extent = this.$refs.taskSource.source.getExtent()
      if (!extent.some((coordinate) => coordinate == Infinity)) {
        setTimeout(() => {
          mapView.fit(extent, {
            size: map.getSize(),
            padding: [20, 20, 20, 20],
            maxZoom: this.project.tileServer.maxZoom | 19,
            duration: duration,
          })
        }, delay)
      }
    },
    forward() {
      if (this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
        this.updateTaskFeature()
      }
    },
    handleToggleOpacity() {
      this.transparent = !this.transparent
      this.updateTaskFeature()
    },
    hex2rgb,
    isAnswered() {
      const result = this.results[this.taskId]
      const defined = result !== undefined
      return defined
    },
    updateTaskFeature() {
      const geoJson = new GeoJSON()
      const geom = this.tasks[this.taskIndex].geojson
      const feature = { geometry: geom, type: 'Feature' }
      const options = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }
      const newFeature = geoJson.readFeature(feature, options)
      this.taskFeatures.clear()
      this.taskFeatures.push(newFeature)
    },
    makeXyzUrl,
  },
  created() {
    this.startTime = new Date().toISOString()
    this.taskId = this.tasks[this.taskIndex].taskId
    this.updateTaskFeature()
    this.$emit('created')
    this.logMappingStarted(this.project.projectType)
  },
})
</script>

<template>
  <project-header :instructionMessage="instructionMessage" :title="project.projectTopic">
    <v-btn
      :title="$t('findProject.toggleOpacity')"
      :icon="'mdi-eye'.concat(transparent ? '-off' : '')"
      @click="handleToggleOpacity()"
      color="primary"
    />
    <v-btn
      :title="$t('tileMap.resetView')"
      icon="mdi-fit-to-screen-outline"
      @click="fitView()"
      color="primary"
    />
    <project-info
      :first="first"
      :informationPages="createInformationPages(tutorial, project, createFallbackInformationPages)"
      :manualUrl="project?.manualUrl"
    >
      <template #instructions>
        <validate-project-instructions
          :instructionMessage="instructionMessage"
          :options="options"
        />
      </template>
    </project-info>
  </project-header>
  <v-container class="ma-0 pa-0">
    <ol-map
      ref="map"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      style="height: calc(100vh - 375px)"
      @rendercomplete.once="fitView(1200, 300)"
    >
      <ol-view
        ref="mapView"
        :zoom="zoom"
        :center="center"
        :maxZoom="project?.tileServer?.maxZoom"
      />
      <ol-tile-layer
        v-if="project?.tileServer?.name != 'bing'"
        id="osmLayer"
        ref="osmLayer"
        :zIndex="1"
      >
        <ol-source-osm />
      </ol-tile-layer>
      <ol-tile-layer id="basemapLayer" ref="basemapLayer" :zIndex="2">
        <ol-source-bingmaps
          v-if="project?.tileServer?.name === 'bing'"
          :api-key="project?.tileServer?.apiKey"
          :imagery-set="project?.tileServer?.imagerySet || 'Aerial'"
        />
        <ol-source-xyz
          v-else
          :url="makeXyzUrl(project.tileServer)"
          :attributions="project.tileServer.credits"
        />
      </ol-tile-layer>

      <ol-vector-layer id="taskLayer" ref="taskLayer" :zIndex="3">
        <ol-source-vector
          v-model:features="taskFeatures"
          @change="fitView()"
          ref="taskSource"
          ident="taskSource"
        />
        <ol-style>
          <ol-style-stroke
            :color="hex2rgb(colors.light.accent, transparent ? 0.4 : 1)"
            :width="5"
          />
          <ol-style-fill color="#0000" />
        </ol-style>
      </ol-vector-layer>
      <ol-scaleline-control />
    </ol-map>
  </v-container>
  <option-buttons
    v-if="taskId"
    :options="options"
    :result="results[taskId]"
    :taskId="taskId"
    @addResult="addResult"
  />
  <v-toolbar color="white" density="compact" extension-height="20" extended>
    <v-spacer />
    <v-btn
      :title="$t('validateProject.moveLeft')"
      icon="mdi-chevron-left"
      color="secondary"
      :disabled="taskIndex <= 0"
      @click="back"
      v-shortkey.once="['arrowleft']"
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
      v-shortkey.once="['arrowright']"
      @shortkey="forward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex + isAnswered()" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
