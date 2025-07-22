<script setup lang="ts" generic="GeoJsonProperties extends GeoJSON.GeoJsonProperties">
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map } from 'maplibre-gl';
import { shallowRef, onMounted, onUnmounted, markRaw, watchEffect, onBeforeUnmount, computed } from 'vue';
import getBbox from '@turf/bbox';
import { isDefined, isNotDefined, listToMap } from '@togglecorp/fujs';

const BOUNDS_SOURCE_NAME = 'bounds-geojson-source';
const BOUNDS_LINE_LAYER_NAME = 'bounds-geojson-line-layer';
const BOUNDS_FILL_LAYER_NAME = 'bounds-geojson-fill-layer';

type Props = {
  geoJson: GeoJSON.GeoJSON<GeoJSON.Geometry, GeoJsonProperties>;
  mapWidth: number;
  mapHeight: number;
  mapState: {
    featureId: number,
    state: {
      key: string,
      value: any,
    }[]
  }[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  onBoundFeatureClick: [properties: GeoJsonProperties],
  onBoundFeatureContextMenu: [properties: GeoJsonProperties],
}>();

const mapContainer = shallowRef<HTMLDivElement | null>(null);
const map = shallowRef<Map | null>(null);
const lastHoveredBoundFeatureId = shallowRef<number | string>();

const bounds = computed(() => (
    getBbox(props.geoJson) as [number, number, number, number]
));

const style = computed(() => ({
  width: `${props.mapWidth}px`,
  height: `${props.mapHeight}px`
}));

watchEffect(() => {
  if (isDefined(map.value) && isDefined(props.mapHeight) && isDefined(props.mapWidth)) {
    const tileSize = Math.round(props.mapHeight / 3);

    const baseTileSource = map.value.getSource('base-tile-source');
    if (isDefined(baseTileSource)) {
      baseTileSource.tileSize = tileSize;
    }

    /*
    map.value.fitBounds(
      bounds.value,
      {
        duration: 0,
        padding: 0,
      },
    );
    */
  }
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
          'base-tile-source': {
            type: 'raster',
            tiles: ['https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=7505'],
            tileSize: 256,
            attribution: '© 2019 Microsoft Corporation, Earthstar Geographics SIO',
            maxzoom: 19,
          },
          'overlay-tile-source': {
            type: 'vector',
            tiles: ['https://vector.osm.org/shortbread_v1/{z}/{x}/{y}.mvt'],
            attribution: 'Map data from OpenStreetMap',
            minzoom: 0,
            maxzoom: 14,
          },
        },
        layers: [
          {
            id: 'base-tile-layer',
            type: 'raster',
            source: 'base-tile-source',
          },
          {
            id: 'overlay-tile-layer',
            type: 'line',
            source: 'overlay-tile-source',
            'source-layer': 'buildings',
            paint: {
              'line-color': '#ffff00',
              'line-width': 2,
            },
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
    if (isDefined(map.value)) {
      if (map.value.getLayer(BOUNDS_LINE_LAYER_NAME)) {
        map.value.removeLayer(BOUNDS_LINE_LAYER_NAME);
      }
      if (map.value.getLayer(BOUNDS_FILL_LAYER_NAME)) {
        map.value.removeLayer(BOUNDS_FILL_LAYER_NAME);
      }
      if (map.value.getSource(BOUNDS_SOURCE_NAME)) {
        map.value.removeSource(BOUNDS_SOURCE_NAME);
      }
    }
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
  map.value?.remove();
});
</script>

<template>
  <div
    class="map-wrapper"
    :style="style"
  >
    <a href="https://www.maptiler.com" class="watermark">
      <img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler logo"/>
    </a>
    <div class="map" ref="mapContainer" />
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  isolation: isolate;
}

.map {
  width: 100%;
  height: 100%;
}

.watermark {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 1;
}
</style>
