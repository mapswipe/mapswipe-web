<script lang="ts">
import { Viewer } from 'mapillary-js'
import 'mapillary-js/dist/mapillary.css'
import { type CSSProperties, defineComponent, type PropType } from 'vue'
import { isDefined } from '@/utils/common'


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
    optionMap: {
      type: Object as PropType<Record<number, Option>>,
      required: false,
    },
  },
  data() {
    return {
      viewer: null,
    }
  },
  computed:{
    overlayStyle() {
      const style: CSSProperties = {}

      if (this.selected) {
        style.border = `20px solid #fff`
      } else {
        style.border = 'unset'
      }

      if (isDefined(this.value)) {
        style.backgroundColor = this.optionMap[this.value]?.color
      }

      return style
    },
    overlayLabel() {
      if (!isDefined(this.value)) {
        return undefined
      }

      return this.optionMap[this.value].label
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
        container: this.containerId,
        imageId: imageId,
        renderMode: 0, // Letterbox
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
    :id="`${containerId}`"
    class="ma-0 pa-0"
    style="position: relative; height: calc(100vh - 375px)"
  />
</template>

<style scoped></style>
