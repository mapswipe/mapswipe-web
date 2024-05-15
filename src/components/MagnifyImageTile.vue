<script lang="ts">
import { defineComponent } from 'vue'
import ImageTile from '@/components/ImageTile.vue'

export default defineComponent({
  components: {
    imageTile: ImageTile,
  },
  props: {
    handleTileClickedFun: {
      type: String,
      require: true,
    },
    isHovering: {
      type: Boolean,
      default: false,
    },
    task: {
      type: Object,
      require: true,
    },
    transparent: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      overlay: true,
    }
  },
})
</script>

<template>
  <v-dialog max-width="80vh" eager>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-show="isHovering"
        v-bind="activatorProps"
        color="neutral"
        style="opacity: 0.6"
        class="mr-2 mt-6"
        icon="mdi-magnify"
        size="small"
      />
    </template>
    <!-- eslint-disable-next-line vue/no-unused-vars -->
    <template v-slot:default="{ isActive }">
      <v-hover v-slot="{ isHovering, props }">
        <v-card v-bind="props" class="pa-2" color="white" @click="$emit('tileClicked')" rounded="0">
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
    </template>
  </v-dialog>
</template>

<style scoped></style>
