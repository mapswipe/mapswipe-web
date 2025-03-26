<script lang="ts">
import { theme } from '@/plugins/vuetify'
import hex2rgb from '@/utils/hex2rgb'
import makeXyzUrl from '@/utils/makeXyzUrl'
import type { OlMap, OlView } from 'node_modules/vue3-openlayers/dist/components/map'
import type { OlSourceVector } from 'node_modules/vue3-openlayers/dist/components/sources'
import { Collection } from 'ol'
import { GeoJSON } from 'ol/format'
import { type PropType, defineComponent } from 'vue'

interface Task {
  taskId: string
  geojson: object
}

export interface Project {
  tileServer: {
    apiKey: string
    credits: string
    name: string
    url: string
    maxZoom?: number
    imagerySet?: string
  }
}

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true,
    },
    project: {
      type: Object as PropType<Project>,
      required: true,
    },
    transparent: {
      type: Boolean,
    },
    compact: {
      type: Boolean,
    },
  },
  data(): {
    center: [number, number]
    results: Record<string, number>
    startTime: string | null
    currentTaskIndex: number
    zoom: number
  } {
    return {
      center: [0, 0],
      results: {},
      startTime: null,
      currentTaskIndex: 0,
      zoom: 3,
    }
  },
  updated() {
    this.fitView()
  },
  computed: {
    mapStyle() {
      if (this.compact) {
        return { height: 'max(calc(70vh - 390px), 300px)' }
      }

      return {
        height: 'max(calc(100vh - 390px), 600px)',
      }
    },
    xyzUrl() {
      return makeXyzUrl(this.project.tileServer)
    },
    strokeColor() {
      const color = hex2rgb(theme.light.accent, this.transparent ? 0.4 : 1)
      return color
    },
    maxZoom() {
      // return this.project.tileServer.maxZoom ?? 19;
      return this.project.tileServer.maxZoom ?? 20
    },
    taskFeatures() {
      const features = new Collection()
      const geoJson = new GeoJSON()

      const geom = this.task.geojson
      const feature = { geometry: geom, type: 'Feature' }
      const options = {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }

      const newFeature = geoJson.readFeature(feature, options)
      features.push(newFeature)

      return features
    },
  },
  methods: {
    fitView(duration = 600, delay = 100) {
      const map = (this.$refs.map as InstanceType<typeof OlMap>).map
      const mapView = this.$refs.mapView as InstanceType<typeof OlView>
      const extent = (
        this.$refs.taskSource as InstanceType<typeof OlSourceVector>
      ).source.getExtent()

      if (!extent.some((coordinate) => coordinate == Infinity)) {
        setTimeout(() => {
          mapView.fit(extent, {
            size: map.getSize(),
            padding: this.compact ? [10, 10, 10, 10] : [20, 20, 20, 20],
            maxZoom: this.maxZoom,
            duration: duration,
          })
        }, delay)
      }
    },
  },
})
</script>

<template>
  <ol-map
    ref="map"
    :load-tiles-while-animating="true"
    :load-tiles-while-interacting="true"
    :style="mapStyle"
    @rendercomplete.once="fitView(1200, 300)"
  >
    <ol-view ref="mapView" :zoom="zoom" :center="center" :maxZoom="project?.tileServer?.maxZoom" />
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
      <ol-source-xyz v-else :url="xyzUrl" :attributions="project.tileServer.credits" />
    </ol-tile-layer>
    <ol-vector-layer id="taskLayer" ref="taskLayer" :zIndex="3" :key="task.taskId">
      <ol-source-vector :features="taskFeatures" ref="taskSource" ident="taskSource" />
      <ol-style :key="strokeColor">
        <ol-style-stroke :color="strokeColor" :width="5" />
        <ol-style-fill color="#0000" />
      </ol-style>
    </ol-vector-layer>
    <ol-scaleline-control />
  </ol-map>
</template>
