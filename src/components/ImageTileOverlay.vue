<script lang="ts">
import { type PropType, defineComponent, type CSSProperties } from 'vue'

export default defineComponent({
  props: {
    overlayStyle: {
      type: Object as PropType<CSSProperties>,
    },
    isHovering: {
      type: Boolean,
    },
    overlayLabel: {
      type: String,
    },
  },
})
</script>
<template>
  <div class="overlay" :style="overlayStyle" />
  <div class="overlay-label" v-if="isHovering">
    {{ overlayLabel }}
  </div>
</template>

<style scoped>
.overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.4;
  width: 100%;
  height: 100%;
  user-select: none;
}

.overlay-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
  color: white;
  text-shadow: 0 0 10px #000;
  user-select: none;
}
</style>
