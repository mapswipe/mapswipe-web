<script setup lang="ts" generic="GeoJsonProperties extends GeoJSON.GeoJsonProperties">
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map } from 'maplibre-gl';
import { shallowRef, onMounted, onUnmounted, markRaw, watchEffect, onBeforeUnmount, computed, watch } from 'vue';
import getBbox from '@turf/bbox';
import { isDefined, isNotDefined, listToMap } from '@togglecorp/fujs';
import type { OverlayTileServer, TileServer } from '@/utils/types';

const BASE_SOURCE_NAME = 'base-source';
const BASE_RASTER_LAYER_NAME = 'base-raster-layer';

const BOUNDS_SOURCE_NAME = 'bounds-geojson-source';
const BOUNDS_LINE_LAYER_NAME = 'bounds-geojson-line-layer';
const BOUNDS_FILL_LAYER_NAME = 'bounds-geojson-fill-layer';

const OVERLAY_SOURCE_NAME = 'overlay-source';
const OVERLAY_RASTER_LAYER_NAME = 'overlay-raster-layer';
const OVERLAY_LINE_LAYER_NAME = 'overlay-line-layer';
const OVERLAY_FILL_LAYER_NAME = 'overlay-fill-layer';

type Props = {
  geoJson: GeoJSON.GeoJSON<GeoJSON.Geometry, GeoJsonProperties>;
  tileSize: number;
  mapWidth: number;
  mapHeight: number;
  mapState: {
    featureId: number,
    state: {
      key: string,
      value: any,
    }[]
  }[];
  tileServer: TileServer;
  overlayTileServer: OverlayTileServer;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  onBoundFeatureClick: [properties: GeoJsonProperties],
  onBoundFeatureContextMenu: [properties: GeoJsonProperties],
}>();

const mapContainer = shallowRef<HTMLDivElement | null>(null);
const map = shallowRef<Map | null>(null);
const lastHoveredBoundFeatureId = shallowRef<number | string>();
const updateBoundsRef = shallowRef();

function getUpdatedUrl(url: string) {
  // NOTE: maplibre uses `quadkey`
  return url.replace('quad_key', 'quadkey');
}

const bounds = computed(() => (
  getBbox(props.geoJson) as [number, number, number, number]
));

function updateBounds() {
  window.clearTimeout(updateBoundsRef.value);
  updateBoundsRef.value = window.setTimeout(() => {
    if (isDefined(map.value)) {
      map.value.fitBounds(
        bounds.value,
        {
          padding: 0,
          duration: 200,
        },
      );
    }
  }, 200);
}

const style = computed(() => ({
  width: `${props.mapWidth}px`,
  height: `${props.mapHeight}px`,
}));

watchEffect(() => {
  if (isDefined(map.value)) {
    const baseTileSource = map.value.getSource(BASE_SOURCE_NAME);
    if (isDefined(baseTileSource)) {
      baseTileSource.tileSize = props.tileSize;
      updateBounds();
    }
  }
});

watch(style, () => {
  updateBounds();
});


function clearLastHoveredFeatureState() {
  if (isDefined(map.value) && isDefined(lastHoveredBoundFeatureId.value)) {
    map.value.removeFeatureState(
      {
        id: lastHoveredBoundFeatureId.value,
        source: BOUNDS_SOURCE_NAME,
      },
      'hovered',
    );
    lastHoveredBoundFeatureId.value = undefined;
  }
}


onMounted(() => {
  if (mapContainer.value) {
    const mapValue = markRaw(new Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {
          [BASE_SOURCE_NAME]: {
            type: 'raster',
            tiles: [getUpdatedUrl(props.tileServer.url)],
            tileSize: 256,
            attribution: props.tileServer.credits,
            // maxzoom: 19,
          },
        },
        layers: [
          {
            id: BASE_RASTER_LAYER_NAME,
            type: 'raster',
            source: BASE_SOURCE_NAME,
          },
        ],
      },
      center: [0, 0],
      zoom: 0,
      attributionControl: false,
      scrollZoom: false,
      doubleClickZoom: false,
      dragPan: false,
      pitchWithRotate: false,
      dragRotate: false,
    }));

    mapValue.on('styledata', () => {
      map.value = mapValue;
    });

    mapValue.on('mousemove', (data) => {
      if (!map.value) {
        return;
      }

      const { point } = data;

      const hoveredBoundFeatures = mapValue.queryRenderedFeatures(
        point,
        { layers: [BOUNDS_FILL_LAYER_NAME] }
      );

      const firstHoveredFeature = hoveredBoundFeatures[0];

      if (isNotDefined(firstHoveredFeature)) {
        clearLastHoveredFeatureState();
      } else if (firstHoveredFeature.id !== lastHoveredBoundFeatureId.value) {
        if (isDefined(lastHoveredBoundFeatureId.value)) {
          map.value.removeFeatureState(
            {
              id: lastHoveredBoundFeatureId.value,
              source: BOUNDS_SOURCE_NAME,
            },
            'hovered',
          );
        }
        map.value.setFeatureState(
          {
            id: firstHoveredFeature.id,
            source: BOUNDS_SOURCE_NAME,
          },
          {'hovered': true },
        );
        lastHoveredBoundFeatureId.value = firstHoveredFeature.id;
      }
    });

    mapValue.on('mouseout', clearLastHoveredFeatureState);

    mapValue.on('click', (data) => {
      if (!map.value) {
        return;
      }

      const { point } = data;

      const clickedBoundFeatures = mapValue.queryRenderedFeatures(
        point,
        { layers: [BOUNDS_FILL_LAYER_NAME] }
      );

      const firstClickedFeature = clickedBoundFeatures[0];

      if (isDefined(firstClickedFeature)) {
        emit('onBoundFeatureClick', firstClickedFeature.properties as GeoJsonProperties);
      }
    });

    // for right click
    mapValue.on('contextmenu', (data) => {
      if (!map.value) {
        return;
      }
      const { point } = data;
      const clickedBoundFeatures = mapValue.queryRenderedFeatures(
        point,
        { layers: [BOUNDS_FILL_LAYER_NAME] }
      );

      const firstClickedFeature = clickedBoundFeatures[0];

      if (isDefined(firstClickedFeature)) {
        emit('onBoundFeatureContextMenu', firstClickedFeature.properties as GeoJsonProperties);
      }
    });
  }
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

function removeLayerSafe(layerName: string) {
  if (isDefined(map.value)) {
    if (map.value.getLayer(layerName)) {
      map.value.removeLayer(layerName);
    }
  }
}

function removeSourceSafe(sourceName: string) {
  if (isDefined(map.value)) {
    if (map.value.getSource(sourceName)) {
      map.value.removeSource(sourceName);
    }
  }
}

watchEffect((onCleanup) => {
  if (isDefined(map.value)) {
    const {
      overlayTileServer,
    } = props;

    if (overlayTileServer.type === 'raster') {
      const { raster } = overlayTileServer;

      map.value.addSource(
        OVERLAY_SOURCE_NAME,
        {
          type: 'raster',
          tiles: [getUpdatedUrl(raster.url)],
          attribution: raster.credits,
        },
      );

      map.value.addLayer({
        id: OVERLAY_RASTER_LAYER_NAME,
        type: 'raster',
        source: OVERLAY_SOURCE_NAME
      });
    } else {
      const { vector } = overlayTileServer;
      map.value.addSource(
        OVERLAY_SOURCE_NAME,
        {
          type: 'vector',
          tiles: [vector.tileServer.url],
          attribution: vector.tileServer.credits,
          minzoom: vector.tileServer.maxZoom,
          maxzoom: vector.tileServer.maxZoom,
        },
      );

      map.value.addLayer({
        id: OVERLAY_LINE_LAYER_NAME,
        type: 'line',
        source: OVERLAY_SOURCE_NAME,
        'source-layer': vector.tileServer.sourceLayer,
        paint: {
          'line-color': vector.lineColor,
          'line-width': vector.lineWidth,
          'line-opacity': vector.lineOpacity,
          'line-dasharray': vector.lineDasharray,
        },
      });

      map.value.addLayer({
        id: OVERLAY_FILL_LAYER_NAME,
        type: 'fill',
        source: OVERLAY_SOURCE_NAME,
        'source-layer': vector.tileServer.sourceLayer,
        paint: {
          'fill-color': vector.fillColor,
          'fill-opacity': vector.fillOpacity,
        },
      });
    }
  }

  onCleanup(() => {
    removeLayerSafe(OVERLAY_RASTER_LAYER_NAME);
    removeLayerSafe(OVERLAY_LINE_LAYER_NAME);
    removeLayerSafe(OVERLAY_FILL_LAYER_NAME);
    removeSourceSafe(OVERLAY_SOURCE_NAME);
  });
});

watchEffect((onCleanup) => {
  if (isDefined(map.value)) {
    map.value.addSource(BOUNDS_SOURCE_NAME, {
      type: 'geojson',
      data: props.geoJson,
    });

    map.value.addLayer({
      id: BOUNDS_FILL_LAYER_NAME,
      type: 'fill',
      source: BOUNDS_SOURCE_NAME,
      paint: {
        'fill-color': [
          'match',
          ['feature-state', 'result'],
          0,
          'white',
          1,
          'green',
          2,
          'orange',
          3,
          'red',
          'orange',
        ],
        'fill-opacity': [
          'case',
          [
            'any',
            ['!=', ['feature-state', 'result'], 0],
            ['boolean', ['feature-state', 'hovered'], false],
          ],
          0.3,
          0,
        ],
      }
    });

    map.value.addLayer({
      id: BOUNDS_LINE_LAYER_NAME,
      type: 'line',
      source: BOUNDS_SOURCE_NAME,
      paint: {
        'line-color': '#ffffff',
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          20,
          2,
        ],
        'line-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          0.7,
          1,
        ],
        'line-offset': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          8,
          0,
        ],
      },
    });

    map.value.fitBounds(
      bounds.value,
      {
        duration: 0,
        padding: 0,
      },
    );

  }

  onCleanup(() => {
    removeLayerSafe(BOUNDS_LINE_LAYER_NAME);
    removeLayerSafe(BOUNDS_FILL_LAYER_NAME);
    removeSourceSafe(BOUNDS_SOURCE_NAME);
  });
});

watchEffect(() => {
  if (isDefined(map.value)) {
    props.mapState.forEach((featureState) => {
      map.value?.setFeatureState(
        {
          id: featureState.featureId,
          source: BOUNDS_SOURCE_NAME,
        },
        listToMap(
          featureState.state,
          ({ key }) => key,
          ({ value }) => value,
        ),
      )
    });
  }
});

onUnmounted(() => {
  window.clearTimeout(updateBoundsRef.value);
  map.value?.remove();
});
</script>

<template>
  <div class="map-wrapper">
    <div
      :style="style"
      ref="mapContainer"
    />
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  background-color: gray;
  isolation: isolate;
}
</style>
