<script lang="ts" setup>
import { computed } from 'vue';


interface Props {
  // FIXME: color should not be undefined
  color: string | undefined;
  label: string | undefined;
  persistentLabel?: boolean;
  isSelected?: boolean;
}

const props = defineProps<Props>()

const style = computed(() => ({
  backgroundColor: props.color,
  border: props.isSelected
    ? '10pt solid rgba(255, 255, 255, 1)'
    : undefined,
}))

</script>

<template>
  <div class="tile-overlay">
    <div
      class="value-indicator"
      :style="style"
    />
    <div :class="persistentLabel ? 'persistent-label' : 'label'">
      {{label}}
    </div>
  </div>
</template>

<style scoped>
.tile-overlay {
  aspect-ratio: 1;
  position: relative;
  border: 1pt solid rgba(255, 255, 255, .6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  isolation: isolate;

  .persistent-label,
  .label {
    z-index: 1;
    color: white;
    text-shadow: 0 0 10pt #000;
    font-weight: bold;
    text-align: center;
    user-select: none;
  }

  .label {
    opacity: 0;
  }

  .value-indicator {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: .4;
    filter: brightness(200%);
  }

  &:hover {
    background-color: rgba(255, 255, 255, .1);

    .label {
      opacity: 1;
    }
  }
}
</style>
