<script lang="ts">
import { isDefined } from '@/utils/common'
import { type PropType, defineComponent } from 'vue'
import ImageTile from '@/components/ImageTile.vue'
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
  },
  computed: {
    overlayBorder() {
      if (!this.selected) {
        return undefined
      }

      return 'border: 20px solid #ccca'
    },
    overlayOpacity() {
      if (!isDefined(this.value) || this.value === 0) {
        return 0
      }

      return 0.5
    },
    overlayColor() {
      if (!isDefined(this.value)) {
        return undefined
      }

      return this.optionMap[this.value]?.color
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
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      v-bind="props"
      color="white"
      :disabled="tilesInSelection && !selected"
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
      <v-overlay
        :key="value"
        :model-value="true"
        :opacity="overlayOpacity"
        :style="overlayBorder"
        :scrim="overlayColor"
        class="justify-center align-center"
        contained
      >
        <h2 v-if="overlayLabel" v-show="isHovering || selected" style="text-align: center">
          {{ overlayLabel }}
        </h2>
      </v-overlay>
      <v-overlay :model-value="true" opacity="0" class="justify-end align-start" contained>
        <magnify-image-tile
          :iconSize="iconSize"
          :show="!!isHovering"
          :task="task"
          :transparent="transparent"
          @tileClicked="$emit('updateValue', task.taskId)"
        />
        <v-btn
          v-show="isHovering"
          color="neutral"
          style="opacity: 0.6"
          @click="handleSelectClick"
          class="mr-2 mt-2"
          :icon="checkboxIcon"
          :size="iconSize"
        />
      </v-overlay>
    </v-card>
  </v-hover>
</template>
