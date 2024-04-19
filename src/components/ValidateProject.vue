<script lang="ts">
import { defineComponent } from 'vue'
import { theme } from '@/plugins/vuetify'
import OptionButtons from '@/components/OptionButtons.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import ValidateProjectInstructions from '@/components/ValidateProjectInstructions.vue'
import { GeoJSON } from 'ol/format'
import { Collection, View } from 'ol'
import type VectorSource from "ol/source/Vector"
import makeXyzUrl from "@/utils/makeXyzUrl"
import hex2rgb from "@/utils/hex2rgb"

interface Option {
  mdiIcon: string
  description: string
  iconColor: string
  shortkey: number
  title: string
  value: number
}

interface Task {
  taskId: string
  geojson: any // You should replace `any` with the actual type of your GeoJSON data
}

interface Project {
  lookFor: string
  tileServer: {
    name: string
    maxZoom?: number
    apiKey?: string
    imagerySet?: string
    credits?: string
  }
  manualUrl?: string
  projectTopic: string
}

export default defineComponent({
  components: {
    validateProjectInstructions: ValidateProjectInstructions,
    taskProgress: TaskProgress,
    optionButtons: OptionButtons,
    projectHeader: ProjectHeader,
  },
  props: {
    group: {
      type: Object as () => Record<string, unknown>,
      require: true,
    },
    first: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array as () => Option[],
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
      type: Object as () => Project,
      require: true,
    },
    tasks: {
      type: Array as () => Task[],
      require: true,
    },
  },
  data() {
    return {
      center: [0, 0] as [number, number],
      results: {} as Record<string, number>,
      startTime: null as string | null,
      taskFeatures: new Collection() as Collection<any>, // You should replace `any` with the actual type of your GeoJSON data
      taskId: undefined as string | undefined,
      taskIndex: 0,
      transparent: false,
      zoom: 3,
    }
  },
  inject: {
    saveResults: 'saveResults',
  },
  computed: {
    colors(): any {
      return theme
    },
    instructionMessage(): string {
      const message = this.$t('validateProject.doesTheShapeOutline', {
        feature: this.project?.lookFor,
      })
      return message as string
    },
  },
  methods: {
    hex2rgb,
    makeXyzUrl,
    addResult(value: number): void {
      this.results[this.taskId!] = value
    },
    back(): void {
      if (this.tasks && !(this.taskIndex <= 0)) {
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
        this.updateTaskFeature()
      }
    },
    fitView(duration: number = 600, delay: number = 100): void {
      const map = (this.$refs.map as any)?.map // Casting to `any` to avoid TypeScript errors, consider a more precise type if possible
      const mapView = this.$refs.mapView as View | undefined // Define the type of mapView
      const taskSource = this.$refs.taskSource as { source: VectorSource } // Define the type of taskSource
      if (mapView && taskSource.source) {
        const extent = taskSource.source.getExtent()
        if (!extent.some(coordinate => coordinate === Infinity)) {
          setTimeout(() => {
            mapView.fit(extent, {
              size: map?.getSize(),
              padding: [20, 20, 20, 20],
              maxZoom: this.project?.tileServer?.maxZoom || 19,
              duration: duration,
            })
          }, delay)
        }
      }
    },
    forward(): void {
      if (this.tasks && this.isAnswered() && this.taskIndex + 1 < this.tasks.length) {
        this.taskIndex++
        this.taskId = this.tasks[this.taskIndex].taskId
        this.updateTaskFeature()
      }
    },
    handleToggleOpacity(): void {
      this.transparent = !this.transparent
      this.updateTaskFeature()
    },
    isAnswered(): boolean {
      const result = this.results[this.taskId!]
      return result !== undefined
    },
    updateTaskFeature(): void {
      if(! this.tasks)
        return
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
  },
  created() {
    if (! this.project) {
      throw new Error('Project prop must be provided and cannot be null or undefined.')
    }
    if(! this.tasks)
      throw new Error('Tasks must be provided and cannot be undefined or [].')
    this.startTime = new Date().toISOString()
    this.taskId = this.tasks[this.taskIndex].taskId
    this.updateTaskFeature()
  },
})
</script>

<template>
  <project-header :instructionMessage="instructionMessage" :title="project!.projectTopic">
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
    <validate-project-instructions
        :attribution="attribution"
        :first="first"
        :instructionMessage="instructionMessage"
        :manualUrl="project?.manualUrl"
        :options="options"
    />
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
            :attributions="project!.tileServer.credits"
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
        :disabled="Object.keys(results).length < tasks!.length"
        @click="saveResults(results, startTime)"
    />
    <v-btn
        :title="$t('validateProject.moveRight')"
        icon="mdi-chevron-right"
        color="secondary"
        :disabled="!isAnswered() || taskIndex + 1 === tasks!.length"
        @click="forward"
        v-shortkey.once="['arrowright']"
        @shortkey="forward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex + isAnswered()" :total="tasks!.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
