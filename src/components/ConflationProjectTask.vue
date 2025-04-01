<script lang="ts">
import hex2rgb from '@/utils/hex2rgb'
import makeXyzUrl from '@/utils/makeXyzUrl'
import type { OlMap, OlView } from 'node_modules/vue3-openlayers/dist/components/map'
import type { OlSourceVector } from 'node_modules/vue3-openlayers/dist/components/sources'
import { Collection } from 'ol'
import { GeoJSON } from 'ol/format'
import { type PropType, defineComponent } from 'vue'
import { extractGeometries } from '@/utils/extractOSMGeometries'

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
    taskExtent: {
      type: Array,
      required: true,
    },
  },
  data(): {
    center: [number, number]
    results: Record<string, number>
    startTime: string | null
    currentTaskIndex: number
    zoom: number
    osmFeatureCollection: Collection
    osmLayer: any
    ready: Boolean
  } {
    return {
      center: [0, 0],
      results: {},
      startTime: null,
      currentTaskIndex: 0,
      zoom: 3,
      osmFeatureCollection: new Collection(),
      osmLayer: null,
      ready: false,
    }
  },
  mounted() {
    this.fetchOSMFeatures().then(() => {
      this.ready = true
      this.fitView()
    })
  },
  updated() {
    this.fetchOSMFeatures().then(() => {
      this.ready = true
      this.fitView()
    })
  },
  computed: {
    mapStyle() {
      if (this.compact) {
        return { height: 'max(calc(70vh - 375px), 300px)' }
      }

      return {
        height: 'max(calc(100vh - 375px), 600px)',
      }
    },
    xyzUrl() {
      return makeXyzUrl(this.project.tileServer)
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
    async fetchOSMFeatures() {
      try {
        this.ready = false
        this.osmFeatureCollection.clear()
        const geoJson = new GeoJSON()
        const osmGeometries = await extractGeometries(
          this.taskExtent.toString(),
          'building=* and geoemtry:polygon',
          '2024-03-25',
        )
        const options = {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        }
        console.log('extent', this.taskExtent.toString())
        osmGeometries.forEach((osmGeom) => {
          const osmFeature = geoJson.readFeature({ geometry: osmGeom, type: 'Feature' }, options)
          this.osmFeatureCollection.push(osmFeature)
        })
      } catch (error) {
        console.error('Error fetching OSM features:', error)
      }
    },
    strokeColor(hex) {
      const color = hex2rgb(hex, this.transparent ? 0.4 : 0.8)
      return color
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
      id="osmBaseLayer"
      ref="osmBaseLayer"
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
    <ol-vector-layer id="taskLayer" ref="taskLayer" :zIndex="4" :key="task.taskId">
      <ol-source-vector :features="taskFeatures" ref="taskSource" ident="taskSource" />
      <ol-style :key="transparent">
        <ol-style-stroke :color="ready ? strokeColor('#1976D2') : '#0000'" :width="5" />
        <ol-style-fill color="#0000" />
      </ol-style>
    </ol-vector-layer>
    <ol-vector-layer id="osmFeatureLayer" ref="osmFeatureLayer" :zIndex="3" :key="task.taskId">
      <ol-source-vector
        :features="osmFeatureCollection"
        ref="osmFeatureSource"
        ident="osmFeatureSource"
      />
      <ol-style :key="transparent">
        <ol-style-stroke :color="ready ? strokeColor('#D32F2F') : '#0000'" :width="5" />
        <ol-style-fill color="#0000" />
      </ol-style>
    </ol-vector-layer>
    <ol-scaleline-control />
  </ol-map>
</template>
