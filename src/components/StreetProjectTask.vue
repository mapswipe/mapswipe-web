<script lang="ts">
import { Viewer } from 'mapillary-js'
import 'mapillary-js/dist/mapillary.css'
import { defineComponent } from 'vue'

export interface Option {
  color: string
  label: string
  value: number
}

export default defineComponent({
  props: {
    containerId: {
      type: String,
      default: 'mapillary',
      required: true,
    },
    taskId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      imageError: false,
      viewer: null,
    }
  },
  watch: {
    taskId(newTaskId) {
      this.moveViewer(newTaskId)
    },
  },
  methods: {
    initialiseViewer(imageId) {
      this.viewer = new Viewer({
        accessToken: import.meta.env.VITE_MAPILLARY_API_KEY,
        component: { cover: false },
        container: this.containerId,
        renderMode: 0, // Letterbox
      })

      this.viewer.deactivateComponent('direction')
      this.viewer.deactivateComponent('sequence')
      this.viewer.deactivateComponent('keyboard')
      this.viewer.on('dataloading', (e) => this.$emit('dataloading', e))

      this.moveViewer(imageId)
    },
    moveViewer(imageId) {
      this.viewer.moveTo(imageId).then(
        () => {
          this.imageError = false
          this.resetView()
        },
        () => {
          this.imageError = true
          this.$emit('imageError', imageId)
        },
      )
    },
    resetView() {
      this.viewer.setCenter([0.5, 0.5])
      this.viewer.setZoom(0)
    },
  },
  mounted() {
    this.initialiseViewer(this.taskId)
  },
  unmounted() {
    this.viewer.remove()
  },
})
</script>

<template>
  <v-container :id="`${containerId}`" :class="'ma-0 pa-0' + (imageError ? ' error' : '')" />
</template>

<style scoped>
#mapillary.error {
  filter: opacity(20%) brightness(0%);
}
</style>
