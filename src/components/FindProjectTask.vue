<script lang="ts">
import { isDefined } from '@/utils/common'
import { type PropType, defineComponent, type CSSProperties } from 'vue'
import ImageTile from '@/components/ImageTile.vue'
import ImageTileOverlay from '@/components/ImageTileOverlay.vue'
import MagnifyImageTile from '@/components/MagnifyImageTile.vue'

interface Task {
  taskId: string
  url: string
  urlB?: string
}

export interface Option {
  color: string
  label: string
  value: number
}

export default defineComponent({
  components: {
    imageTile: ImageTile,
    imageTileOverlay: ImageTileOverlay,
    magnifyImageTile: MagnifyImageTile,
  },
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true,
    },
    tilesInSelection: {
      type: Boolean,
    },
    selected: {
      type: Boolean,
    },
    transparent: {
      type: Boolean,
    },
    tileSize: {
      type: Number,
    },
    value: {
      type: Number,
    },
    optionMap: {
      type: Object as PropType<Record<number, Option>>,
      required: true,
    },
    withoutActions: {
      type: Boolean,
    },
  },
  computed: {
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
    },
    iconSize() {
      const size = (this.tileSize ?? 0) < 256 ? 'x-small' : 'small'
      return size
    },
    checkboxIcon() {
      if (this.selected) {
        return 'mdi-checkbox-marked-circle'
      }

      return 'mdi-checkbox-blank-circle-outline'
    },
  },
  methods: {
    handleContextMenu(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()

      this.$emit('updateSelected', !this.selected, this.task.taskId)
    },
    handleSelectClick(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()

      this.$emit('updateSelected', !this.selected, this.task.taskId)
    },
    handleClick(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()

      this.$emit('updateValue', this.task.taskId)
    },
  },
  emits: ['updateValue', 'updateSelected'],
})
</script>

<template>
  <v-hover v-slot="{ isHovering, props: hoverProps }">
    <v-card
      class="task-card"
      v-bind="hoverProps"
      color="white"
      @click.stop="handleClick"
      @contextmenu="handleContextMenu"
      variant="outlined"
      rounded="0"
      :height="tileSize"
      :width="tileSize"
    >
      <image-tile
        :url="task.url"
        :urlB="task.urlB"
        :spinner="true"
        :opacityB="transparent ? 0.3 : 1"
      />
      <image-tile-overlay
        :isHovering="!!isHovering"
        :overlayStyle="overlayStyle"
        :overlayLabel="overlayLabel"
      />
      <div v-if="!withoutActions" class="tile-actions" v-show="isHovering">
        <magnify-image-tile
          :iconSize="iconSize"
          :task="task"
          :transparent="transparent"
          :overlayStyle="overlayStyle"
          :overlayLabel="overlayLabel"
          @tileClicked="$emit('updateValue', task.taskId)"
        />
        <v-btn
          color="neutral"
          style="opacity: 0.6"
          @click="handleSelectClick"
          class="mr-2 mt-2"
          :icon="checkboxIcon"
          :size="iconSize"
        />
      </div>
    </v-card>
  </v-hover>
</template>
<style scoped>
.task-card {
  position: relative;
}

.tile-actions {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
