<script lang="ts">
import { defineComponent, type CSSProperties, type PropType } from 'vue'
import ImageTile from '@/components/ImageTile.vue'
import ImageTileOverlay from '@/components/ImageTileOverlay.vue'

export default defineComponent({
  components: {
    imageTile: ImageTile,
    imageTileOverlay: ImageTileOverlay,
  },
  props: {
    iconSize: {
      type: String,
      default: 'small',
    },
    task: {
      type: Object,
      required: true,
    },
    transparent: {
      type: Boolean,
      default: false,
    },
    overlayLabel: {
      type: String,
    },
    overlayStyle: {
      type: Object as PropType<CSSProperties>,
    },
  },
  data() {
    return {
      dialog: false,
      overlay: true,
    }
  },
  methods: {
    closeDialog() {
      this.dialog = false
    },
  },
  emits: ['tileClicked'],
})
</script>

<template>
  <v-btn
    @click.stop="dialog = true"
    color="neutral"
    style="opacity: 0.6"
    class="mr-1 mt-2"
    icon="mdi-magnify"
    :size="iconSize"
  />
  <v-dialog v-model="dialog" max-width="80vh">
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <v-card
        v-bind="hoverProps"
        v-click-outside="closeDialog"
        v-touch="{ left: closeDialog, right: closeDialog }"
        @click="$emit('tileClicked')"
        class="pa-2"
        color="white"
        rounded="0"
      >
        <image-tile
          :url="task.url"
          :urlB="task.urlB"
          :spinner="true"
          :opacityB="transparent ? 0.3 : 1"
        />
        <image-tile-overlay
          :overlayStyle="overlayStyle"
          :isHovering="!!isHovering"
          :overlayLabel="overlayLabel"
        />
      </v-card>
    </v-hover>
  </v-dialog>
</template>

<style scoped></style>
