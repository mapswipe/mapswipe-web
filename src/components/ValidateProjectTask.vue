<script lang="ts">
import { theme } from '@/plugins/vuetify'
import hex2rgb from '@/utils/hex2rgb'
import makeXyzUrl from '@/utils/makeXyzUrl'
import type { TileServer } from '@/utils/types'
import type { OlMap, OlView } from 'node_modules/vue3-openlayers/dist/components/map'
import type { OlSourceVector } from 'node_modules/vue3-openlayers/dist/components/sources'
import { Collection } from 'ol'
import { type Extent, getCenter } from 'ol/extent'
import { GeoJSON } from 'ol/format'
import { toLonLat } from 'ol/proj'
import { type PropType, defineComponent } from 'vue'

const MAP_MIN_ZOOM_LEVEL = 0
const MAP_MAX_ZOOM_LEVEL = 24

// NOTE: A point or a very small feature is shown with this much ground around it
const MIN_FIT_SIZE_IN_METERS = 20
const FIT_PADDING_RATIO = 0.1

// Grow the extent around its center to at least the given size on the ground
function expandExtent(extent: Extent, minSizeInMeters: number): Extent {
  const center = getCenter(extent)
  const [, centerLat] = toLonLat(center)
  // NOTE: Web Mercator stretches ground distances by 1 / cos(latitude)
  const halfSize = minSizeInMeters / 2 / Math.cos((centerLat * Math.PI) / 180)

  return [
    Math.min(extent[0], center[0] - halfSize),
    Math.min(extent[1], center[1] - halfSize),
    Math.max(extent[2], center[0] + halfSize),
    Math.max(extent[3], center[1] + halfSize),
  ]
}

interface Task {
  taskId: string
  geojson: object
}

export interface Project {
  // NOTE: Is a fallback image for older apps when the project has pre-event imagery
  tileServer: TileServer
  hasPreImagery?: boolean
  preEventTileServer?: TileServer
  postEventTileServer?: TileServer
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
  setup() {
    return { MAP_MIN_ZOOM_LEVEL, MAP_MAX_ZOOM_LEVEL }
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
  mounted() {
    // NOTE: Share the view so that the pre-event map pans and zooms along with the post-event map
    const preEventMap = this.$refs.preEventMap as InstanceType<typeof OlMap> | undefined
    const mapView = this.$refs.mapView as InstanceType<typeof OlView>
    preEventMap?.map.setView(mapView.view)
  },
  updated() {
    this.fitView()
  },
  computed: {
    preEventTileServer(): TileServer | undefined {
      if (!this.project.hasPreImagery) {
        return undefined
      }
      return this.project.preEventTileServer
    },
    postEventTileServer(): TileServer {
      if (!this.project.hasPreImagery) {
        return this.project.tileServer
      }
      return this.project.postEventTileServer ?? this.project.tileServer
    },
    isStacked() {
      // NOTE: Pre-event and post-event maps are stacked on small screens
      return !!this.preEventTileServer && this.$vuetify.display.smAndDown
    },
    mapStyle() {
      if (this.compact) {
        return {
          height: this.isStacked
            ? 'max(calc(35vh - 195px), 150px)'
            : 'max(calc(70vh - 390px), 300px)',
        }
      }

      if (this.isStacked) {
        return { height: 'max(calc(50vh - 195px), 300px)' }
      }

      // NOTE: Side-by-side maps are shorter so that they fit with the answer buttons on a 1366x768 window
      return {
        height: this.preEventTileServer
          ? 'max(calc(100vh - 390px), 240px)'
          : 'max(calc(100vh - 390px), 600px)',
      }
    },
    strokeColor() {
      const color = hex2rgb(theme.light.accent, this.transparent ? 0.4 : 1)
      return color
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
          const size = map.getSize()
          if (!size) {
            return
          }

          const [width, height] = size
          const verticalPadding = height * FIT_PADDING_RATIO
          const horizontalPadding = width * FIT_PADDING_RATIO
          mapView.fit(expandExtent(extent, MIN_FIT_SIZE_IN_METERS), {
            size,
            padding: [verticalPadding, horizontalPadding, verticalPadding, horizontalPadding],
            duration: duration,
          })
        }, delay)
      }
    },
    xyzUrl(tileCoord: [number, number, number]) {
      const url = makeXyzUrl(this.postEventTileServer, tileCoord)
      return url
    },
    preEventXyzUrl(tileCoord: [number, number, number]) {
      const url = makeXyzUrl(this.preEventTileServer, tileCoord)
      return url
    },
  },
})
</script>

<template>
  <div class="maps" :class="{ stacked: isStacked, 'with-pre-event': preEventTileServer }">
    <div v-if="preEventTileServer" class="imagery pre-event">
      <ol-map
        ref="preEventMap"
        :load-tiles-while-animating="true"
        :load-tiles-while-interacting="true"
        :style="mapStyle"
      >
        <ol-tile-layer v-if="preEventTileServer.name != 'bing'" :zIndex="1">
          <ol-source-osm />
        </ol-tile-layer>
        <ol-tile-layer :zIndex="2">
          <ol-source-xyz
            :tile-url-function="preEventXyzUrl"
            :attributions="preEventTileServer.credits"
            :minZoom="preEventTileServer.minZoom"
            :maxZoom="preEventTileServer.maxZoom"
          />
        </ol-tile-layer>
        <ol-vector-layer :zIndex="3" :key="task.taskId">
          <ol-source-vector :features="taskFeatures" />
          <ol-style :key="strokeColor">
            <ol-style-stroke :color="strokeColor" :width="5" />
            <ol-style-fill color="#0000" />
          </ol-style>
        </ol-vector-layer>
      </ol-map>
      <v-chip class="imagery-label" color="primary" size="small" variant="flat" label>
        {{ $t('validateProject.before') }}
      </v-chip>
    </div>
    <div class="imagery">
      <ol-map
        ref="map"
        :load-tiles-while-animating="true"
        :load-tiles-while-interacting="true"
        :style="mapStyle"
        @rendercomplete.once="fitView(1200, 300)"
      >
        <ol-view
          ref="mapView"
          :zoom="zoom"
          :center="center"
          :minZoom="MAP_MIN_ZOOM_LEVEL"
          :maxZoom="MAP_MAX_ZOOM_LEVEL"
        />
        <ol-tile-layer
          v-if="postEventTileServer.name != 'bing'"
          id="osmLayer"
          ref="osmLayer"
          :zIndex="1"
        >
          <ol-source-osm />
        </ol-tile-layer>
        <ol-tile-layer id="basemapLayer" ref="basemapLayer" :zIndex="2">
          <ol-source-xyz
            :tile-url-function="xyzUrl"
            :attributions="postEventTileServer.credits"
            :minZoom="postEventTileServer.minZoom"
            :maxZoom="postEventTileServer.maxZoom"
          />
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
      <v-chip
        v-if="preEventTileServer"
        class="imagery-label"
        color="primary"
        size="small"
        variant="flat"
        label
      >
        {{ $t('validateProject.after') }}
      </v-chip>
    </div>
  </div>
</template>

<style scoped>
.maps {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 8px;

  &.stacked {
    grid-auto-flow: row;
  }

  .imagery {
    position: relative;

    .imagery-label {
      position: absolute;
      top: 8px;
      left: 8px;
      pointer-events: none;
    }
  }
}

/* NOTE: Only the post-event map has zoom controls, placed away from the label */
.maps .pre-event :deep(.ol-zoom) {
  display: none;
}

.maps.with-pre-event :deep(.ol-zoom) {
  left: auto;
  right: 0.5em;
}
</style>
