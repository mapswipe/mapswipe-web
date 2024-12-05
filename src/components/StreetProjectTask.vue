<script lang="ts">
import { Viewer } from 'mapillary-js'
import 'mapillary-js/dist/mapillary.css'
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    taskId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      viewer: null,
    }
  },
  watch: {
    taskId(newTaskId) {
      this.viewer.moveTo(newTaskId).then(() => this.resetView())
    },
  },
  methods: {
    initialiseViewer(imageId) {
      this.viewer = new Viewer({
        accessToken: import.meta.env.VITE_MAPILLARY_API_KEY,
        component: { cover: false },
        container: 'mapillary',
        imageId: imageId,
      })

      this.viewer.deactivateComponent('direction')
      this.viewer.deactivateComponent('sequence')
      this.viewer.deactivateComponent('keyboard')
      this.viewer.on('dataloading', (e) => this.$emit('dataloading', e))
    },
    resetView() {
      this.viewer.setCenter([0.5, 0.5])
      this.viewer.setZoom(0)
    },
  },
  mounted() {
    this.initialiseViewer(this.taskId)
  },
})
</script>

<template>
  <v-container
    id="mapillary"
    class="ma-0 pa-0"
    style="position: relative; height: calc(100vh - 375px)"
  />
</template>

<style scoped></style>
