<script lang="ts">
import hex2rgb from '@/utils/hex2rgb'
import makeXyzUrl from '@/utils/makeXyzUrl'
import { Feature } from 'ol'
import { type PropType, defineComponent } from 'vue'

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
    taskFeature: {
      type: Feature,
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
    intersectingFeatures: {
      type: Array<Feature>,
    },
    ready: {
      type: Boolean,
      default: false,
    },
  },
  data(): {
    center: [number, number]
    startTime: string | null
    zoom: number
  } {
    return {
      center: [0, 0],
      startTime: null,
      zoom: 3,
    }
  },
  mounted() {
    this.fitView()
  },
  updated() {
    this.fitView()
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
      return this.project.tileServer.maxZoom ?? 22
    },
  },
  methods: {
    fitView(duration = 600, delay = 100) {
      const map = (this.$refs.map as InstanceType<typeof OlMap>).map
      const mapView = this.$refs.mapView as InstanceType<typeof OlView>
      // TODO: Use combined extent of taskSource and osmFeatureSource
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
    <ol-vector-layer id="taskLayer" ref="taskLayer" :zIndex="ready ? 4 : 0" :key="ready">
      <ol-source-vector :features="[taskFeature]" ref="taskSource" ident="taskSource" />
      <ol-style :key="transparent">
        <ol-style-stroke :color="strokeColor('#1976D2')" :width="5" />
        <ol-style-fill color="#0000" />
      </ol-style>
    </ol-vector-layer>
    <ol-vector-layer
      id="osmFeatureLayer"
      ref="osmFeatureLayer"
      :zIndex="3"
      :key="taskFeature.get('taskId')"
    >
      <ol-source-vector
        :features="intersectingFeatures"
        ref="osmFeatureSource"
        ident="osmFeatureSource"
      />
      <ol-style :key="transparent">
        <ol-style-stroke :color="strokeColor('#D32F2F')" :width="5" />
        <ol-style-fill color="#0000" />
      </ol-style>
    </ol-vector-layer>
    <ol-scaleline-control />
  </ol-map>
</template>
