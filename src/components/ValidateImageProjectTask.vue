<script lang="ts" setup>
import type { ImageTask } from '@/utils/types'
import { isNotDefined } from '@togglecorp/fujs'
import { computed, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

interface Props {
  task: ImageTask
}

const imgRef = useTemplateRef('taskImage')
const zoomContainerRef = useTemplateRef('imageZoomContainer')
const props = defineProps<Props>()

const bbox = ref<{ x: string; y: string; width: string; height: string } | undefined>()
const debounceTimeoutRef = shallowRef()

// image zoom and pan states
const MIN_SCALE = 1
const MAX_SCALE = 6

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isPanning = ref(false)
const isTransitioning = ref(false)
const controlsExpanded = ref(false)

let panStart = { x: 0, y: 0, translateX: 0, translateY: 0 }
let transitionTimeout: ReturnType<typeof window.setTimeout>
let pinchStartDistance = 0
let pinchStartScale = 1

// computed styles for image zoom and pan
const imageZoomTransformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
  transition: isTransitioning.value ? 'transform 0.2s ease-out' : 'none',
}))

const imageZoomContainerStyle = computed(() => ({
  aspectRatio: `${props.task.width} / ${props.task.height}`,
}))

// computed icon for zoom toggle button
const zoomToggleIcon = computed(() =>
  scale.value > 1 ? 'mdi-magnify-remove-outline' : 'mdi-magnify-scan',
)

// calculate the bounding box of the task in the image
function calculateBbox() {
  if (isNotDefined(imgRef.value?.image)) {
    bbox.value = undefined
    return
  }

  if (isNotDefined(props.task.bbox)) {
    bbox.value = undefined
    return
  }

  const imageWidth = props.task.width ?? imgRef.value.image.naturalWidth
  const imageHeight = props.task.height ?? imgRef.value.image.naturalHeight

  const containerWidth = imgRef.value.image.clientWidth
  const containerHeight = imgRef.value.image.clientHeight

  const containerAspectRatio = containerWidth / containerHeight
  const imageAspectRatio = imageWidth / imageHeight

  const renderedHeight =
    imageAspectRatio > containerAspectRatio ? containerWidth / imageAspectRatio : containerHeight

  const renderedWidth =
    containerAspectRatio > imageAspectRatio ? containerHeight * imageAspectRatio : containerWidth

  const yExcess = containerHeight - renderedHeight
  const xExcess = containerWidth - renderedWidth

  const [x1, y1, w, h] = props.task.bbox

  const cx = (x1 / imageWidth) * renderedWidth + xExcess / 2
  const cy = (y1 / imageHeight) * renderedHeight + yExcess / 2
  const cw = (w / imageWidth) * renderedWidth
  const ch = (h / imageHeight) * renderedHeight

  bbox.value = {
    x: `${cx}px`,
    y: `${cy}px`,
    width: `${cw}px`,
    height: `${ch}px`,
  }
}

watch(() => props.task, calculateBbox)

function handleResize() {
  calculateBbox()
}

function handleImageLoad() {
  setTimeout(calculateBbox, 0)
}

function handleWindowResize() {
  window.clearTimeout(debounceTimeoutRef.value)
  debounceTimeoutRef.value = window.setTimeout(() => {
    calculateBbox()
  }, 200)
}

// clamping the translation values to prevent the image from moving out of bounds
function clampTranslate() {
  const container = zoomContainerRef.value
  if (!container) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const scaledWidth = containerWidth * scale.value
  const scaledHeight = containerHeight * scale.value

  const minX = Math.min(0, containerWidth - scaledWidth)
  const minY = Math.min(0, containerHeight - scaledHeight)

  translateX.value = Math.min(0, Math.max(minX, translateX.value))
  translateY.value = Math.min(0, Math.max(minY, translateY.value))
}

// zooming at a specific point (clientX, clientY) with a new scale
function zoomAt(clientX: number, clientY: number, newScale: number) {
  const container = zoomContainerRef.value
  if (!container) return

  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale))
  if (clamped === scale.value) return

  const rect = container.getBoundingClientRect()
  const pointerX = clientX - rect.left
  const pointerY = clientY - rect.top

  const contentX = (pointerX - translateX.value) / scale.value
  const contentY = (pointerY - translateY.value) / scale.value

  translateX.value = pointerX - contentX * clamped
  translateY.value = pointerY - contentY * clamped
  scale.value = clamped

  clampTranslate()
}

// helper function to perform an action with a transition effect
function withTransition(fn: () => void) {
  isTransitioning.value = true
  fn()
  window.clearTimeout(transitionTimeout)
  transitionTimeout = window.setTimeout(() => {
    isTransitioning.value = false
  }, 200)
}

// reset zoom and pan to the initial state
function resetZoom() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

// zoom in functions
function zoomIn() {
  const container = zoomContainerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  withTransition(() =>
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, scale.value * 1.5),
  )
}

// zoom out functions
function zoomOut() {
  const container = zoomContainerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  withTransition(() =>
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, scale.value / 1.5),
  )
}

// zoom to the bounding box of the task
function zoomToTaskBbox() {
  if (!bbox.value) return
  const container = zoomContainerRef.value
  if (!container) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight

  const bboxWidth = parseFloat(bbox.value.width)
  const bboxHeight = parseFloat(bbox.value.height)
  const bboxX = parseFloat(bbox.value.x)
  const bboxY = parseFloat(bbox.value.y)

  const scaleX = containerWidth / bboxWidth
  const scaleY = containerHeight / bboxHeight
  const newScale = Math.max(MIN_SCALE, Math.min(scaleX, scaleY, MAX_SCALE)) / 1.05

  const bboxCenterX = bboxX + bboxWidth / 2
  const bboxCenterY = bboxY + bboxHeight / 2

  withTransition(() => {
    scale.value = newScale
    translateX.value = containerWidth / 2 - bboxCenterX * newScale
    translateY.value = containerHeight / 2 - bboxCenterY * newScale
    clampTranslate()
  })
}

// event handlers for user interactions
function handleWheel(event: WheelEvent) {
  isTransitioning.value = false
  const zoomFactor = -event.deltaY > 0 ? 1.15 : 1 / 1.15
  zoomAt(event.clientX, event.clientY, scale.value * zoomFactor)
}

// handle double click to zoom in or reset zoom
function handleDoubleClick(event: MouseEvent) {
  if (scale.value > 1) {
    withTransition(resetZoom)
  } else {
    withTransition(() => zoomAt(event.clientX, event.clientY, 2.5))
  }
}

// pointer and touch event handlers for panning and pinch-to-zoom
function handlePointerDown(event: PointerEvent) {
  controlsExpanded.value = false
  if (scale.value <= 1) return
  isPanning.value = true
  panStart = {
    x: event.clientX,
    y: event.clientY,
    translateX: translateX.value,
    translateY: translateY.value,
  }
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

// handle pointer move for panning
function handlePointerMove(event: PointerEvent) {
  if (!isPanning.value) return
  translateX.value = panStart.translateX + (event.clientX - panStart.x)
  translateY.value = panStart.translateY + (event.clientY - panStart.y)
  clampTranslate()
}

// handle pointer up to stop panning
function handlePointerUp() {
  isPanning.value = false
}

// calculate the distance between two touch points
function getTouchDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

// handle touch start for pinch-to-zoom
function handleTouchStart(event: TouchEvent) {
  if (event.touches.length === 2) {
    isPanning.value = false
    pinchStartDistance = getTouchDistance(event.touches)
    pinchStartScale = scale.value
  }
}

// handle touch move for pinch-to-zoom
function handleTouchMove(event: TouchEvent) {
  if (event.touches.length === 2 && pinchStartDistance > 0) {
    event.preventDefault()
    const distance = getTouchDistance(event.touches)
    const factor = distance / pinchStartDistance
    const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2
    const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2
    zoomAt(midX, midY, pinchStartScale * factor)
  }
}

function handleTouchEnd(event: TouchEvent) {
  if (event.touches.length < 2) {
    pinchStartDistance = 0
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  window.clearTimeout(debounceTimeoutRef.value)
})
</script>

<template>
  <div
    v-if="props.task.url"
    class="image-zoom-container"
    ref="imageZoomContainer"
    :class="{ 'is-zoomed': scale > 1, 'is-panning': isPanning }"
    :style="imageZoomContainerStyle"
    @wheel.prevent="handleWheel"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
    @pointercancel="handlePointerUp"
    @dblclick="handleDoubleClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <v-img
      class="task-image"
      :style="imageZoomTransformStyle"
      v-if="props.task.url"
      :src="props.task.url"
      @load="handleImageLoad"
      :onresize="handleResize"
      ref="taskImage"
    >
      <svg v-if="bbox" class="bbox" view-box="0 0 100 100">
        <rect :x="bbox.x" :y="bbox.y" :width="bbox.width" :height="bbox.height" />
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
    <div
      class="zoom-controls-wrapper"
      @wheel.stop
      @pointerdown.stop
      @dblclick.stop
      @click.stop
      @mouseenter="controlsExpanded = true"
      @mouseleave="controlsExpanded = false"
    >
      <v-btn
        v-if="!controlsExpanded"
        :icon="zoomToggleIcon"
        color="white"
        variant="text"
        class="zoom-toggle-btn"
        :class="{ 'is-zoomed': scale > 1 }"
        size="small"
        @click="controlsExpanded = true"
        :aria-label="$t('imageTile.zoomControls')"
      >
        <v-icon :icon="zoomToggleIcon" />
        <v-tooltip activator="parent" location="top" content-class="small-tooltip">{{
          $t('imageTile.zoomControls')
        }}</v-tooltip>
      </v-btn>
      <ul v-else class="zoom-controls">
        <v-btn
          icon="mdi-magnify-plus"
          color="white"
          variant="text"
          class="zoom-btn"
          size="small"
          :disabled="scale >= MAX_SCALE"
          @click="zoomIn"
          :aria-label="$t('imageTile.zoomIn')"
        >
          <v-icon icon="mdi-magnify-plus" />
          <v-tooltip activator="parent" location="top" content-class="small-tooltip">{{
            $t('imageTile.zoomIn')
          }}</v-tooltip>
        </v-btn>

        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <v-btn
          icon="mdi-magnify-minus"
          color="white"
          variant="text"
          class="zoom-btn"
          size="small"
          :disabled="scale <= MIN_SCALE"
          @click="zoomOut"
          :aria-label="$t('imageTile.zoomOut')"
        >
          <v-icon icon="mdi-magnify-minus" />
          <v-tooltip activator="parent" location="top" content-class="small-tooltip">{{
            $t('imageTile.zoomOut')
          }}</v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-arrow-u-left-top-bold"
          color="white"
          variant="text"
          class="zoom-btn zoom-reset"
          size="small"
          :disabled="scale === 1"
          @click="withTransition(resetZoom)"
          content-class="small-tooltip"
          :aria-label="$t('imageTile.resetZoom')"
        >
          <v-icon icon="mdi-arrow-u-left-top-bold" />
          <v-tooltip activator="parent" location="top" content-class="small-tooltip">{{
            $t('imageTile.resetZoom')
          }}</v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-magnify-expand"
          color="white"
          variant="text"
          class="zoom-btn"
          size="small"
          @click="zoomToTaskBbox"
          :aria-label="$t('imageTile.zoomToTask')"
        >
          <v-icon icon="mdi-magnify-expand" />
          <v-tooltip activator="parent" location="top" content-class="small-tooltip">{{
            $t('imageTile.zoomToTask')
          }}</v-tooltip>
        </v-btn>
      </ul>
    </div>
  </div>
  <div class="image-not-available" v-if="!props.task.url">
    {{ $t('imageTile.notAvailableMessage') }}
  </div>
</template>

<style scoped>
.image-zoom-container {
  position: relative;
  width: 100%;
  max-height: 100%;
  margin: 0 auto;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}
.image-zoom-container.is-zoomed {
  cursor: grab;
}
.image-zoom-container.is-panning {
  cursor: grabbing;
}

.zoom-level {
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  user-select: none;
}

.task-image {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  will-change: transform;
}
:deep(.small-tooltip) {
  font-size: 0.6rem;
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
  transition: 0.2s all ease-in-out;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
}

.zoom-controls-wrapper {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  max-width: calc(100% - 16px);
}

.zoom-toggle-btn {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  border-radius: 50%;
}

.zoom-toggle-btn.is-zoomed {
  background: rgb(var(--v-theme-error-overlay-multiplier)) !important;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.zoom-controls .zoom-btn,
.zoom-controls .zoom-level {
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .zoom-controls-wrapper {
    right: 4px;
    bottom: 4px;
  }

  .zoom-controls {
    gap: 0;
    padding: 2px 4px;
  }

  .zoom-controls .zoom-btn {
    padding: 0 px;
  }

  .zoom-level {
    font-size: 0.7rem;
    padding: 0 2px;
  }
}
</style>
