<script lang="ts">
import { type PropType, defineComponent } from 'vue'
import ImageTile from '@/components/ImageTile.vue'

export interface Task {
  taskId: string
  // Are we sure that urls are optional?
  url?: string
  urlB?: string
  referenceAnswer: number
}

export default defineComponent({
  components: {
    imageTile: ImageTile,
  },
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true,
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
  <v-row>
    <v-col cols="12" md="6" align="center">
      <v-hover v-slot="{ isHovering, props }">
        <v-card
          :max-width="$vuetify.display.smAndDown ? '35vh' : '80vh'"
          v-bind="props"
          color="white"
          variant="outlined"
          rounded="0"
        >
          <v-overlay
            v-model="overlay"
            @update:modelValue="overlay = true"
            opacity="0"
            class="justify-center align-center"
            contained
          >
            <h2 v-show="isHovering">{{ $t('compareProject.before') }}</h2>
          </v-overlay>
          <image-tile
            v-if="task.url"
            :url="task.url"
            :spinner="true"
            :maxSize="$vuetify.display.smAndDown ? '35vh' : '65vh'"
          />
        </v-card>
      </v-hover>
    </v-col>
    <v-col cols="12" md="6" align="center">
      <v-hover v-slot="{ isHovering, props }">
        <v-card
          :max-width="$vuetify.display.smAndDown ? '35vh' : '65vh'"
          v-bind="props"
          color="white"
          variant="outlined"
          rounded="0"
        >
          <v-overlay
            v-model="overlay"
            @update:modelValue="overlay = true"
            opacity="0"
            class="justify-center align-center"
            contained
          >
            <h2 v-show="isHovering">{{ $t('compareProject.after') }}</h2>
          </v-overlay>
          <image-tile
            :url="task.urlB"
            :spinner="true"
            :maxSize="$vuetify.display.smAndDown ? '35vh' : '80vh'"
          />
        </v-card>
      </v-hover>
    </v-col>
  </v-row>
</template>
