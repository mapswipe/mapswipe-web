<script lang="ts">
import { defineComponent } from 'vue'
import geomFromTileCoords from '@/utils/geomFromTileCoords'
import { theme } from '@/plugins/vuetify'

export default defineComponent({
  props: {
    page: {
      type: Array,
      required: true,
    },
    zoomLevel: {
      type: Number,
      require: true,
    },
  },
  data: () => ({
    center: [0, 0],
    zoom: 3,
  }),
  computed: {
    pageGeometries() {
      const geometries = this.page.flat().map((task) => {
        return geomFromTileCoords(
          parseInt(task.taskX),
          parseInt(task.taskY),
          parseInt(this.zoomLevel),
        )
      })
      return geometries
    },
    initialZoom() {
      let zoom = Math.max(this.zoomLevel - 4, 3)
      return zoom
    },
    colors() {
      const colors = theme
      return colors
    },
  },
  methods: {
    getPageCentroid(geometries) {
      const nodes = geometries.flat(2)
      const x = nodes.map((node) => node[0])
      const y = nodes.map((node) => node[1])
      const cx = (Math.min(...x) + Math.max(...x)) / 2
      const cy = (Math.min(...y) + Math.max(...y)) / 2
      const centroid = [cx, cy]
      return centroid
    },
    fitView(duration = 600, delay = 0) {
      setTimeout(() => {
        this.$refs.mapView?.animate({
          zoom: this.initialZoom,
          center: this.getPageCentroid(this.pageGeometries),
          duration: duration,
        })
      }, delay)
    },
  },
})
</script>

<template>
  <v-dialog max-width="80vh" :persistent="false">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        :title="$t('tileMap.whereAmI')"
        :disabled="!page"
        icon="mdi-earth"
        color="primary"
        v-bind="activatorProps"
      />
    </template>
    <template v-slot:default="{ isActive }">
      <v-card>
        <v-card-title class="text-h5"> {{ $t('tileMap.youAreHere') }}. </v-card-title>
        <v-card-text>
          <ol-map
            ref="map"
            style="height: 80vh"
            :loadTilesWhileAnimating="true"
            :loadTilesWhileInteracting="true"
            @rendercomplete.once="fitView(1200, 300)"
          >
            <ol-view ref="mapView" :zoom="zoom" :center="center" />
            <ol-tile-layer id="osmLayer" ref="osmLayer" :zIndex="1">
              <ol-source-osm />
            </ol-tile-layer>

            <ol-vector-layer :zIndex="2">
              <ol-source-vector>
                <ol-feature v-for="(coords, index) in pageGeometries" :key="index">
                  <ol-geom-polygon :coordinates="coords" />
                  <ol-style>
                    <ol-style-stroke :color="colors.light.primary" :width="3"></ol-style-stroke>
                    <ol-style-fill color="#0000"></ol-style-fill>
                  </ol-style>
                </ol-feature>
              </ol-source-vector>
            </ol-vector-layer>
            <!-- TODO button position fixed to map instead of v-card-->
            <v-btn
              :title="$t('tileMap.resetView')"
              icon="mdi-fit-to-screen-outline"
              @click="fitView()"
              style="opacity: 0.7"
              position="fixed"
              location="top right"
              class="mt-5 mr-5"
              variant="flat"
            />
            <ol-scaleline-control />
          </ol-map>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-spacer />
          <v-btn color="primary" @click="isActive.value = false">{{ $t('tileMap.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped></style>
