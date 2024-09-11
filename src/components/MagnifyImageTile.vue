<script lang="ts">
import { defineComponent } from 'vue'
import ImageTile from '@/components/ImageTile.vue'

export default defineComponent({
  components: {
    imageTile: ImageTile,
  },
  props: {
    iconSize: {
      type: String,
      default: 'small',
    },
    show: {
      type: Boolean,
      default: false,
    },
    task: {
      type: Object,
      required: true,
    },
    transparent: {
      type: Boolean,
      default: false,
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
    v-show="show"
    @click.stop="dialog = true"
    color="neutral"
    style="opacity: 0.6"
    class="mr-1 mt-2"
    icon="mdi-magnify"
    :size="iconSize"
  />
  <v-dialog v-model="dialog" max-width="80vh">
    <v-hover v-slot="{ isHovering, props }">
      <v-card
        v-bind="props"
        v-click-outside="closeDialog"
        v-touch="{ left: closeDialog, right: closeDialog }"
        @click="$emit('tileClicked')"
        class="pa-2"
        color="white"
        rounded="0"
      >
        <v-overlay
          v-model="overlay"
          @update:modelValue="overlay = true"
          :opacity="task.index == 0 ? 0 : 0.5"
          :scrim="task.color"
          class="justify-center align-center"
          contained
        >
          <h1 v-show="isHovering" style="color: white">{{ task.label }}</h1>
        </v-overlay>
        <image-tile
          :url="task.url"
          :urlB="task.urlB"
          :spinner="true"
          :opacityB="transparent ? 0.3 : 1"
        />
      </v-card>
    </v-hover>
  </v-dialog>
</template>

<style scoped></style>
