<script lang="ts" setup>
import type { CustomOption, TileTask } from '@/utils/types'
import ImageTile from './ImageTile.vue';
import { computed } from 'vue';
import TileOverlay from './TileOverlay.vue';

interface Props {
  task: TileTask
  subGridSizeExponent: number;
  optionMapping: Record<string, CustomOption>;
  nextOptionMapping: Record<number, number>;
  value: number[];
  tileSize: number;
  selectedIndices: boolean[];
}

const props = defineProps<Props>()

const emit = defineEmits<{
  onValueChange: [taskId: TileTask['taskId'], newResults: number[]]
  onSelectionChange: [taskId: TileTask['taskId'], newSelectedIndices: boolean[]]
}>()

const gridSize = 2 ** props.subGridSizeExponent;
const overlayGrids = Array.from(new Array(gridSize ** 2).keys());

const taskContainerStyle = computed(() => ({
  width: `${props.tileSize}px`,
}))

const overlayGridsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
  gridTemplateRows: `repeat(${gridSize}, 1fr)`,
}))

function getNewValue(oldValue: number) {
  return props.nextOptionMapping[oldValue];
}

function handleClick(gridIndex: number) {
  const newValue = [...props.value]

  const newIndexValue = getNewValue(props.value[gridIndex]);

  if (props.selectedIndices.some((isSelected) => isSelected)) {
    if (!props.selectedIndices[gridIndex]) {
      return;
    }

    props.selectedIndices.forEach((isSelected, index) => {
      if (isSelected) {
        newValue[index] = newIndexValue;
      }
    })
  } else {
    newValue[gridIndex] = newIndexValue;
  }

  emit('onValueChange', props.task.taskId, newValue)
}

function handleContextMenu(gridIndex: number) {
  const newSelectedIndices = [...props.selectedIndices]
  newSelectedIndices[gridIndex] = !props.selectedIndices[gridIndex]
  emit('onSelectionChange', props.task.taskId, newSelectedIndices)
}

const overlayGridColors = computed(() => (
  props.value.map((subGridValue) => {
    const selectedOption = props.optionMapping[subGridValue];

    return selectedOption.iconColor;
  })
))

const overlayGridLabels = computed(() => (
  props.value.map((subGridValue) => {
    const selectedOption = props.optionMapping[subGridValue];

    return selectedOption.title
  })
))

</script>

<template>
  <v-container>
    <v-row justify="center">
      <div
        class="task-container"
        :style="taskContainerStyle"
      >
        <ImageTile
          :url="task.url"
          :spinner="true"
        />
        <div
          class="overlay-grids"
          :style="overlayGridsStyle"
        >
          <TileOverlay
            v-for="gridIndex in overlayGrids"
            v-bind:key="gridIndex"
            @click="handleClick(gridIndex)"
            @contextmenu.prevent.stop="handleContextMenu(gridIndex)"
            :color="overlayGridColors[gridIndex]"
            :label="overlayGridLabels[gridIndex]"
            :isSelected="selectedIndices[gridIndex]"
          />
        </div>
      </div>
    </v-row>
  </v-container>
</template>

<style scoped>
.task-container {
  aspect-ratio: 1;
  position: relative;
  isolation: isolate;

  .overlay-grids {
    display: grid;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
