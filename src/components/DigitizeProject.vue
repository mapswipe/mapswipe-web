<script lang="ts">
import { defineComponent } from 'vue'
import hex2rgb from '@/utils/hex2rgb'
import makeXyzUrl from '@/utils/makeXyzUrl'
import { theme } from '@/plugins/vuetify'
import DigitizeProjectInstructions from '@/components/DigitizeProjectInstructions.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import TaskProgress from '@/components/TaskProgress.vue'
import { GeoJSON } from 'ol/format'
import { createBox } from 'ol/interaction/Draw'
import { Collection } from 'ol'

export default defineComponent({
  components: {
    digitizeProjectInstructions: DigitizeProjectInstructions,
    taskProgress: TaskProgress,
    projectHeader: ProjectHeader,
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
    project: {
      type: Object,
      require: true,
    },
    tasks: {
      type: Array,
      require: true,
    },
  },
  data() {
    return {
      endReached: false,
      center: [0, 0],
      drawing: false,
      drawnFeatures: new Collection(),
      interaction: 'draw',
      mapCursor: 'default',
      selectedFeatures: new Collection(),
      startTime: null,
      taskFeatures: new Collection(),
      taskId: undefined,
      taskIndex: 0,
      topmostFeatureAtCoordId: undefined,
      transparent: false,
      withinTaskGeom: false,
      zoom: 3,
    }
  },
  inject: {
    saveResults: 'saveResults',
  },
  computed: {
    colors() {
      const colors = theme
      return colors
    },
    drawType() {
      return this.project.drawType === 'Box' ? 'Circle' : this.project.drawType
    },
    geometryFunction() {
      return this.project.drawType === 'Box' ? createBox() : undefined
    },
    instructionMessage() {
      const message = this.$t('digitizeProject.draw', { lookFor: this.project.lookFor })
      return message
    },
    snap() {
      // TODO
      // return typeof this.drawType === undefined || this.drawType?.match(/^(Polygon|LineString)$/)
      return true
    },
  },
  methods: {
    back() {
      if (!this.taskIndex <= 0) {
        this.taskIndex--
        this.taskId = this.tasks[this.taskIndex].taskId
        this.updateTaskFeature()
      }
    },
    drawCondition() {
      return this.withinTaskGeom || this.drawing
    },
    drawStart(e) {
      this.drawing = true
      e.feature.setProperties({ taskIndex: this.taskIndex, taskId: this.taskId })
    },
    drawEnd() {
      this.drawing = false
    },
    deleteFeature() {
      const id = this.topmostFeatureAtCoordId
      const index = this.drawnFeatures.getArray().findIndex((f) => f.ol_uid === id)
      this.drawnFeatures.removeAt(index)
      if (this.drawnFeatures.getLength() === 0) this.interaction = 'draw'
    },
    filterSelection(feature) {
      return feature.ol_uid === this.topmostFeatureAtCoordId
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
      if (this.taskIndex + 1 < this.tasks.length) {
        this.taskIndex++
        if (this.taskIndex + 1 === this.tasks.length) this.endReached = true
        this.taskId = this.tasks[this.taskIndex].taskId
        this.updateTaskFeature()
      }
    },
    handleToggleOpacity() {
      this.transparent = !this.transparent
      this.updateTaskFeature()
    },
    hex2rgb,
    makeXyzUrl,
    pointerDrag() {
      this.mapCursor = 'grabbing'
    },
    pointerMove(e) {
      const coord = e.coordinate
      const taskFeaturesAtCoord = this.$refs.taskSource?.source.getFeaturesAtCoordinate(coord)
      const drawnFeaturesAtCoord = this.$refs.vectorSource?.source.getFeaturesAtCoordinate(coord)
      this.withinTaskGeom = taskFeaturesAtCoord?.length > 0
      this.topmostFeatureAtCoordId = drawnFeaturesAtCoord.reverse()[0]?.ol_uid
      this.mapCursor =
        this.interaction === 'delete' && this.topmostFeatureAtCoordId
          ? 'pointer'
          : this.drawCondition()
            ? 'default'
            : 'grab'
    },
    processResults() {
      const geoJson = new GeoJSON()
      const options = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }
      const results = new Map()
      this.drawnFeatures.forEach((f) => {
        const taskId = f.get('taskId')
        const fgeom = JSON.parse(geoJson.writeFeature(f, options)).geometry
        if (results.has(taskId)) {
          let tempFeatures: Array<any> = results.get(taskId)
          tempFeatures.push(fgeom)
          results.set(taskId, [...tempFeatures])
        } else {
          results.set(taskId, [fgeom])
        }
      })
      this.saveResults(Object.fromEntries(results), this.startTime)
    },
    selectionCondition(e) {
      return e.type == 'pointermove'
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
  },
  created() {
    this.startTime = new Date().toISOString()
    this.taskId = this.tasks[this.taskIndex].taskId
    this.updateTaskFeature()
    if (this.tasks.length === 1) this.endReached = true
  },
})
</script>

<template>
  <project-header :instructionMessage="instructionMessage" :title="project.projectTopic">
    <v-btn-toggle v-model="interaction" variant="outlined" mandatory divided>
      <v-btn
        :title="$t('digitizeProject.draw', { lookFor: this.project.lookFor })"
        icon="mdi-draw"
        value="draw"
        color="primary"
      />
      <v-btn
        v-if="drawType != 'Box'"
        :title="$t('digitizeProject.modify')"
        icon="mdi-vector-polyline-edit"
        value="modify"
        :disabled="this.drawnFeatures.getLength() === 0"
        color="primary"
      />
      <v-btn
        :title="$t('digitizeProject.delete')"
        icon="mdi-delete"
        value="delete"
        :disabled="this.drawnFeatures.getLength() === 0"
        color="warning"
      />
    </v-btn-toggle>
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
    <digitize-project-instructions
      :first="first"
      :drawType="drawType"
      :instructionMessage="instructionMessage"
      :manualUrl="project?.manualUrl"
    />
  </project-header>
  <v-container class="ma-0 pa-0">
    <ol-map
      ref="map"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      :style="{ cursor: mapCursor, height: 'calc(100vh - 375px)' }"
      @click="deleteFeature"
      @rendercomplete.once="fitView(1200, 300)"
      @pointermove="pointerMove"
      @pointerdrag="pointerDrag"
    >
      <ol-view
        ref="mapView"
        :zoom="zoom"
        :center="center"
        :maxZoom="project?.tileServer?.maxZoom"
      />
      <ol-tile-layer v-if="project?.tileServer?.name != 'bing'" ref="osmLayer" :zIndex="1">
        <ol-source-osm />
      </ol-tile-layer>

      <ol-tile-layer ref="basemapLayer" :zIndex="2">
        <ol-source-bingmaps
          v-if="project?.tileServer?.name === 'bing'"
          :api-key="project?.tileServer?.apiKey"
          :imagery-set="project?.tileServer?.imagerySet || 'Aerial'"
        />
        <ol-source-xyz
          v-else
          :opaque="false"
          :url="makeXyzUrl(project.tileServer)"
          :attributions="project.tileServer.credits"
        />
      </ol-tile-layer>

      <ol-tile-layer v-if="project.tileServerB && !transparent" ref="basemapLayerB" :zIndex="3">
        <ol-source-xyz
          :opaque="false"
          :url="makeXyzUrl(project.tileServerB)"
          :attributions="project.tileServerB.credits"
        />
      </ol-tile-layer>

      <ol-vector-layer ref="taskLayer" id="taskLayer" :zIndex="4">
        <!-- TODO: Avoid fitView on style change -->
        <ol-source-vector v-model:features="taskFeatures" ref="taskSource" @change="fitView()" />
        <ol-style>
          <ol-style-stroke
            :color="hex2rgb(colors.light.accent, transparent ? 0.4 : 1)"
            :width="5"
          />
          <ol-style-fill color="#0000" />
        </ol-style>
      </ol-vector-layer>

      <ol-vector-layer ref="vectorLayer" :zIndex="5">
        <ol-source-vector v-model:features="drawnFeatures" ref="vectorSource">
          <!-- TODO: Snap to taskSource and vectorSource -->
          <ol-interaction-draw
            v-if="interaction === 'draw'"
            :type="drawType || 'Polygon'"
            :condition="drawCondition"
            :geometryFunction="geometryFunction"
            :stopClick="true"
            @drawend="drawEnd"
            @drawstart="drawStart"
          />
          <ol-interaction-modify v-if="interaction === 'modify'" />
          <ol-interaction-select
            v-model:features="selectedFeatures"
            v-if="interaction === 'delete'"
            :condition="selectionCondition"
            :filter="filterSelection"
          >
            <ol-style v-if="drawType === 'Circle'">
              <ol-style-stroke
                :color="hex2rgb(colors.light.warning, transparent ? 0.3 : 0.7)"
                :width="6"
              />
              <ol-style-fill
                :color="hex2rgb(colors.light.primary || '#ffffff', transparent ? 0 : 0.1)"
              />
            </ol-style>
            <ol-style v-else>
              <ol-style-stroke
                :color="hex2rgb(colors.light.warning || '#ffffff', transparent ? 0.1 : 0.3)"
                :width="5"
              />
              <ol-style-fill :color="hex2rgb(colors.light.primary, transparent ? 0.1 : 0.33)" />
              <ol-style-circle :radius="10">
                <ol-style-stroke
                  :color="hex2rgb(colors.light.warning || '#ffffff', transparent ? 0.33 : 1)"
                  :width="4"
                />
                <ol-style-fill :color="hex2rgb(colors.light.primary, transparent ? 0.1 : 1)" />
              </ol-style-circle>
            </ol-style>
          </ol-interaction-select>
        </ol-source-vector>
        <ol-style v-if="drawType === 'Circle'">
          <ol-style-stroke
            :color="hex2rgb(colors.light.tertiary, transparent ? 0.3 : 0.7)"
            :width="4"
          />
          <ol-style-fill
            :color="hex2rgb(colors.light.primary || '#ffffff', transparent ? 0 : 0.1)"
          />
        </ol-style>
        <ol-style v-else>
          <ol-style-stroke
            :color="hex2rgb(colors.light.tertiary || '#ffffff', transparent ? 0.1 : 0.3)"
            :width="3"
          />
          <ol-style-fill :color="hex2rgb(colors.light.primary, transparent ? 0.1 : 0.33)" />
          <ol-style-circle :radius="10">
            <ol-style-stroke
              :color="hex2rgb(colors.light.tertiary || '#ffffff', transparent ? 0.33 : 1)"
              :width="2"
            />
            <ol-style-fill :color="hex2rgb(colors.light.primary, transparent ? 0.1 : 1)" />
          </ol-style-circle>
        </ol-style>
      </ol-vector-layer>
    </ol-map>
  </v-container>
  <v-toolbar color="white" density="compact" extension-height="20" extended>
    <v-spacer />
    <v-btn
      :title="$t('digitizeProject.moveLeft')"
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
      :disabled="!endReached"
      @click="processResults()"
    />
    <v-btn
      :title="$t('digitizeProject.moveRight')"
      icon="mdi-chevron-right"
      color="secondary"
      :disabled="taskIndex + 1 === tasks.length"
      @click="forward"
      v-shortkey.once="['arrowright']"
      @shortkey="forward"
    />
    <v-spacer />
    <template #extension>
      <task-progress :progress="taskIndex + 1" :total="tasks.length" />
    </template>
  </v-toolbar>
</template>

<style scoped></style>
