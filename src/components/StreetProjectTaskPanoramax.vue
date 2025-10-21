<script lang="ts">
import { defineComponent } from 'vue'
import '@panoramax/web-viewer/build/index.css'
import '@panoramax/web-viewer'

export default defineComponent({
  props: {
    containerId: {
      type: String,
      default: 'panoramax',
    },
    taskId: { type: String, required: true },
    endpoint: { type: String, default: 'https://api.panoramax.xyz/api' },
  },
  data() {
    return {
      viewer: null as HTMLElement | null,
    }
  },
  watch: {
    taskId(newTaskId) {
      this.moveViewer(newTaskId)
    },
  },
  methods: {
    initialiseViewer() {
      this.viewer = this.$refs.viewer as HTMLElement
      this.viewer.addEventListener('ready', () => {
        this.removeArrows()
      })
      this.viewer.addEventListener('psv:picture-loading', () => {
        this.$emit('dataloading', true)
      })
      this.viewer.addEventListener('psv:picture-loaded', () => {
        this.$emit('dataloading', false)
      })
      this.viewer.addEventListener('broken', () => {
        this.$emit('imageError', this.taskId)
      })
    },
    moveViewer(pictureId) {
      this.viewer.select(undefined, pictureId, true)
    },
    removeArrows() {
      const arrows = this.viewer.querySelector('.psv-virtual-tour-arrows')
      if (arrows) arrows.remove()
    },
  },
  mounted() {
    this.initialiseViewer()
    this.moveViewer(this.taskId)
  },
})
</script>

<template>
  <v-container :id="`${containerId}`" class="ma-0 pa-0">
    <pnx-photo-viewer
      ref="viewer"
      :endpoint="endpoint"
      widgets="false"
      url-parameters="false"
      keyboard-shortcuts="false"
    />
  </v-container>
</template>

<style scoped></style>
