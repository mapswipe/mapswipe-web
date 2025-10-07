<script lang="ts">
import { defineComponent } from 'vue'
import '@panoramax/web-viewer/build/index.css'
import '@panoramax/web-viewer'

export default defineComponent({
  props: {
    taskId: { type: String, required: true },
  },
  data() {
    return {
      viewer: null as HTMLElement | null,
      endpoint: 'https://api.panoramax.xyz/api',
      pictureId: '362aba76-f730-49b6-ae04-aebcbfb958e0',
    }
  },
  watch: {
    taskId(newTaskId) {
      this.moveViewer(newTaskId)
    },
  },
  methods: {
    moveViewer(pictureId) {
      this.viewer.select(undefined, pictureId, true)
    },
    removeArrows() {
      const arrows = this.viewer.querySelector('.psv-virtual-tour-arrows')
      if (arrows) arrows.remove()
    },
  },
  mounted() {
    this.viewer = this.$refs.viewer as HTMLElement
    this.viewer.addEventListener('ready', () => {
      this.removeArrows()
      console.log('Web component viewer ready')
    })
  },
})
</script>

<template>
  <div>
    <pnx-photo-viewer
      ref="viewer"
      :endpoint="endpoint"
      :picture="pictureId"
      widgets="false"
      url-parameters="false"
      keyboard-shortcuts="false"
    ></pnx-photo-viewer>
  </div>
</template>

<style scoped></style>
