<script lang="ts" setup>
import type { ImageTask } from '@/utils/types';
import { isNotDefined } from '@togglecorp/fujs';
import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

interface Props {
  task: ImageTask;
}

const imgRef = useTemplateRef("taskImage");
const props = defineProps<Props>();

const bbox = ref<{ x: string, y: string, width: string, height: string} | undefined>();
const debounceTimeoutRef = shallowRef();

function calculateBbox() {
  if (isNotDefined(imgRef.value?.image)) {
    bbox.value = undefined;
    return;
  }

  if (isNotDefined(props.task.bbox)) {
    bbox.value = undefined;
    return;
  }

  const imageWidth = props.task.width ?? imgRef.value.image.naturalWidth;
  const imageHeight = props.task.height ?? imgRef.value.image.naturalHeight;

  const containerWidth = imgRef.value.image.clientWidth;
  const containerHeight = imgRef.value.image.clientHeight;

  const containerAspectRatio = containerWidth / containerHeight;
  const imageAspectRatio = imageWidth / imageHeight;

  const renderedHeight = imageAspectRatio > containerAspectRatio
    ? containerWidth / imageAspectRatio
    : containerHeight;

  const renderedWidth = containerAspectRatio > imageAspectRatio
    ? containerHeight * imageAspectRatio
    : containerWidth;

  const yExcess = containerHeight - renderedHeight;
  const xExcess = containerWidth - renderedWidth;

  const [x1, y1, w, h] = props.task.bbox;

  const cx = (x1 / imageWidth) * renderedWidth + xExcess / 2;
  const cy = (y1 / imageHeight) * renderedHeight + yExcess / 2;
  const cw = (w / imageWidth) * renderedWidth;
  const ch = (h / imageHeight) * renderedHeight;

  bbox.value = {
    x: `${cx}px`,
    y: `${cy}px`,
    width: `${cw}px`,
    height: `${ch}px`,
  }
}

watch(
  () => props.task,
  calculateBbox,
);

function handleResize() {
  calculateBbox();
}

function handleImageLoad() {
  setTimeout(calculateBbox, 0);
}

function handleWindowResize() {
  window.clearTimeout(debounceTimeoutRef.value);
  debounceTimeoutRef.value = window.setTimeout(() => {
    calculateBbox();
  }, 200);
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
  window.clearTimeout(debounceTimeoutRef.value);
});

</script>

<template>
  <v-img
    class="task-image"
    v-if="props.task.url"
    :src="props.task.url"
    @load="handleImageLoad"
    :onresize="handleResize"
    ref="taskImage"
  >
    <svg
      v-if="bbox"
      class="bbox"
      view-box="0 0 100 100"
    >
      <rect
        :x="bbox.x"
        :y="bbox.y"
        :width="bbox.width"
        :height="bbox.height"
      />
    </svg>
    <template v-slot:placeholder>
      <v-row class="fill-height ma-0" align="center" justify="center">
        <v-progress-circular color="primary" indeterminate />
      </v-row>
    </template>
    <template v-slot:error>
      <v-row class="fill-height ma-0 image-failed" align="center" justify="center">
        {{ $t('imageTile.failureMessage') }}
      </v-row>
    </template>
  </v-img>
  <div class="image-not-available" v-if="!props.task.url">
    {{ $t('imageTile.notAvailableMessage') }}
  </div>
</template>

<style scoped>
.task-image {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
}
.image-not-available {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  aspect-ratio: 1;
  background-color: #a1a1a1;
  color: rgba(255, 255, 255, 0.6);
}
.image-failed {
  color: rgba(255, 255, 255, 0.6);
  background-color: #a1a1a1;
}
.bbox {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.bbox rect {
  stroke: #fff;
  stroke-width: 2;
  fill: #fff;
  fill-opacity: 0.1;
  transition: .2s all ease-in-out;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
}
</style>
