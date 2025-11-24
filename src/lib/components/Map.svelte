<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Map from 'ol/Map';
  import View from 'ol/View';
  import TileLayer from 'ol/layer/Tile';
  import XYZ from 'ol/source/XYZ';
  import { fromLonLat, get as getProjection, transformExtent } from 'ol/proj';
  import { Feature } from 'ol';
  import Point from 'ol/geom/Point';
  import VectorLayer from 'ol/layer/Vector';
  import VectorSource from 'ol/source/Vector';
  import Cluster from 'ol/source/Cluster';
  import { Style, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
  import { defaults as defaultControls, Attribution, Zoom } from 'ol/control';
  import { easeOut } from 'ol/easing';
  import 'ol/ol.css';
  import type { Marker } from '$lib/types';

  export let markers: Marker[] = [];
  export let resetSignal = 0;
  export let activeMarker: Marker | null = null;

  let mapElement: HTMLDivElement;
  let map: Map;
  let view: View;
  let nlExtent: number[];
  let clusterLayer: VectorLayer<Cluster>;
  let baseLayer: TileLayer;

  const dispatch = createEventDispatcher();

  const LABEL_ZOOM_THRESHOLD = 9.6;
  const DEFAULT_ZOOM = 7.4;
  const SELECT_ZOOM = 12;

  let mapInitialized = false;
  let zoomLocked = false;

  /* ⭐ USER ZOOM / CENTER WORDEN HIER OPGESLAGEN */
  let lastZoomBeforeSelect: number | null = null;
  let lastViewCenterBeforeSelect: number[] | null = null;

  let lastResetSignal = 0;

  /* ------------------------------
      HELPERS
  ------------------------------ */
  function createBaseLayer(theme: string) {
    const style = theme === 'dark' ? 'darkmatter' : 'aquarelle';
    return new TileLayer({
      source: new XYZ({
        url: `https://woutervanitterzon.nl/tiles.php?style=${style}&z={z}&x={x}&y={y}`,
        attributions: [
          '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>',
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        ]
      })
    });
  }

  function fixZoomPosition() {
    const zoomEl = mapElement?.querySelector('.custom-zoom') as HTMLElement;
    if (zoomEl) {
      zoomEl.style.position = 'absolute';
      zoomEl.style.top = '14px';
      zoomEl.style.right = '14px';
      zoomEl.style.left = 'auto';
      zoomEl.style.bottom = 'auto';
      zoomEl.style.zIndex = '1000';
    }
  }

  function animateWithLock(
    params: { center?: number[]; zoom?: number; duration?: number; easing?: (t: number) => number },
    done?: () => void
  ) {
    if (!view) return;
    zoomLocked = true;
    view.animate({ duration: 600, easing: easeOut, ...params }, () => {
      zoomLocked = false;
      done && done();
    });
  }

  /* ------------------------------
      INIT
  ------------------------------ */
  onMount(() => {
    const nlExtentWGS84 = [3.0, 50.7, 7.3, 53.7];
    const projection = getProjection('EPSG:3857');
    nlExtent = transformExtent(nlExtentWGS84, 'EPSG:4326', projection);

    let currentTheme = document.documentElement.dataset.theme || 'light';
    baseLayer = createBaseLayer(currentTheme);

    const nlCenter = fromLonLat([5.3, 52.2]);
    view = new View({
      projection,
      center: nlCenter,
      zoom: DEFAULT_ZOOM,
      minZoom: 6,
      maxZoom: 13,
      extent: nlExtent,
      constrainOnlyCenter: true
    });

    const attributionControl = new Attribution({ collapsible: false });
    attributionControl.element.classList.add('custom-attribution');
    const zoomControl = new Zoom({ className: 'ol-zoom custom-zoom' });

    map = new Map({
      target: mapElement,
      layers: [baseLayer],
      view,
      controls: defaultControls({ zoom: false, attribution: false }).extend([
        zoomControl,
        attributionControl
      ])
    });

    requestAnimationFrame(() => map.updateSize());

    map.once('postrender', () => {
      const size = map.getSize();
      if (size) {
        view.fit(nlExtent, { size, padding: [40, 40, 40, 40], duration: 0 });
        view.setZoom(DEFAULT_ZOOM);
      }
      fixZoomPosition();
      mapInitialized = true;
    });

    setTimeout(() => {
      if (map) {
        map.updateSize();
        setTimeout(() => map.updateSize(), 120);
      }
    }, 180);

    map.on('pointermove', (e) => {
      const hit = map.hasFeatureAtPixel(e.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    map.on('click', handleMapClick);
    view.on('change:resolution', updateClusterLabels);

    /* THEMA SWITCH */
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.dataset.theme;
      if (newTheme && newTheme !== currentTheme) {
        currentTheme = newTheme;

        map.removeLayer(baseLayer);
        baseLayer = createBaseLayer(newTheme);
        map.getLayers().insertAt(0, baseLayer);

        if (clusterLayer) clusterLayer.changed();

        fixZoomPosition();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  });

  /* ------------------------------
      CLUSTERS
  ------------------------------ */
  function renderClusters() {
    if (!map || !markers?.length) return;
    const validMarkers = markers.filter((m) => !isNaN(m.lon) && !isNaN(m.lat));
    if (!validMarkers.length) return;

    const features = validMarkers.map(
      (m) => new Feature({ geometry: new Point(fromLonLat([m.lon, m.lat])), marker: m })
    );

    const clusterSource = new Cluster({
      distance: 30,
      source: new VectorSource({ features })
    });

    const clusterStyleFunction = (feature) => {
      const clustered = feature.get('features');
      const size = clustered.length;
      const zoom = view?.getZoom?.() ?? 0;

      const root = getComputedStyle(document.documentElement);
      const fontBody = root.getPropertyValue('--font-body').trim() || 'Karla, sans-serif';

      const primary = root.getPropertyValue('--color-primary').trim() || '#e67e22';
      const primarySoft = root.getPropertyValue('--color-primary-soft').trim() || '#f3d7b0';

      const isDark = document.documentElement.dataset.theme === 'dark';
      const labelColor = isDark ? '#ffffff' : '#2b2b2b';
      const labelStroke = isDark ? '#000000' : '#ffffff';
      const markerFill = isDark ? '#ffbd70' : primary;

      if (size > 1) {
        return new Style({
          image: new CircleStyle({
            radius: 14 + Math.min(size, 30) / 3,
            fill: new Fill({ color: primarySoft }),
            stroke: new Stroke({ color: labelStroke, width: 2 })
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({ color: labelColor }),
            stroke: new Stroke({ color: labelStroke, width: 2 }),
            font: `600 12px ${fontBody}`,
            overflow: true
          })
        });
      }

      const marker = clustered[0].get('marker') as Marker;

      const textStyle =
        zoom >= LABEL_ZOOM_THRESHOLD
          ? new Text({
              text: marker.place ?? '(onbekend)',
              offsetY: 10,
              textAlign: 'center',
              textBaseline: 'top',
              font: `600 13px ${fontBody}`,
              fill: new Fill({ color: labelColor }),
              stroke: new Stroke({ color: labelStroke, width: 2 }),
              overflow: true
            })
          : undefined;

      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: markerFill }),
          stroke: new Stroke({ color: labelStroke, width: 2 })
        }),
        text: textStyle
      });
    };

    if (clusterLayer) map.removeLayer(clusterLayer);
    clusterLayer = new VectorLayer({
      source: clusterSource,
      style: clusterStyleFunction
    });
    map.addLayer(clusterLayer);
  }

  function updateClusterLabels() {
    if (clusterLayer) clusterLayer.changed();
  }

  /* ------------------------------
      CLICK HANDLING (⭐ FIX HIER!)
  ------------------------------ */
  function handleMapClick(evt) {
    if (zoomLocked) return;

    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, { hitTolerance: 10 });
    if (!feature) return;

    const clustered = feature.get('features');
    if (!clustered) return;

    if (clustered.length > 1) {
      const clusterCoords = feature.getGeometry().getCoordinates();
      animateWithLock({
        center: clusterCoords,
        zoom: Math.min((view.getZoom() ?? DEFAULT_ZOOM) + 1.2, view.getMaxZoom() ?? 13),
        duration: 400,
        easing: easeOut
      });
    } else {
      /* ⭐ BEWAAR USER VIEW OP DIT PERFECTE MOMENT */
      lastZoomBeforeSelect = view.getZoom();
      lastViewCenterBeforeSelect = view.getCenter();

      const marker = clustered[0].get('marker') as Marker;
      dispatch('select', marker);
    }
  }

  /* ------------------------------
      REACTIVE BLOCKS
  ------------------------------ */
  $: if (map && markers) renderClusters();

  /* ⭐ MODAL SLUIT → TERUG NAAR USER LEVEL */
  $: if (mapInitialized && view && resetSignal !== lastResetSignal) {
    const current = resetSignal;
    lastResetSignal = current;

    if (current > 0) {
      const targetCenter =
        lastViewCenterBeforeSelect ?? fromLonLat([5.3, 52.2]);
      const targetZoom =
        lastZoomBeforeSelect ?? DEFAULT_ZOOM;

      animateWithLock({
        center: targetCenter,
        zoom: targetZoom,
        duration: 800,
        easing: easeOut
      });
    }
  }

  /* ⭐ MODAL OPEN → INZOOMEN */
  $: if (map && activeMarker && mapInitialized && !zoomLocked) {
    const coords = fromLonLat([activeMarker.lon, activeMarker.lat]);
    animateWithLock({
      center: coords,
      zoom: SELECT_ZOOM,
      duration: 600,
      easing: easeOut
    });
  }
</script>


<div bind:this={mapElement} id="map"></div>

<style>
  #map {
    width: 100%;
    height: 100%;
    position: fixed;
    inset: 0;
    z-index: 1;
    background: radial-gradient(circle at center, #ffffff 60%, #fdfbf7 100%);
  }



  @media (max-width: 700px) {
    .custom-zoom button {
      width: 46px;
      height: 46px;
      font-size: 24px;
    }
  }
/* --------------------------------------------- */
/*  RETRO ATTRIBUTION — GLOBAL VOOR OPENLAYERS   */
/* --------------------------------------------- */

/* container van de attribution */
:global(.ol-attribution.custom-attribution) {
  position: absolute;
  bottom: 0px;
  right: 0px;
 padding: 1px 1px;
  margin: 0;
  font-size: 9px;
  line-height: 1.25;
  font-family: var(--font-body);
  background: rgba(255, 255, 255, 0.25);
 color: #444;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);

  z-index: 998;
}

/* inhoud (ul) netjes maken */
:global(.ol-attribution.custom-attribution ul) {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 0.4rem;
}

/* dark mode variant */
:global([data-theme='dark'] .ol-attribution.custom-attribution) {
  background: rgba(0, 0, 0, 0.45);
  color: #ddd;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
}

/* links binnen de attribution */
:global(.ol-attribution.custom-attribution a) {
  color: inherit;
  text-decoration: none;
  opacity: 0.85;
}

:global(.ol-attribution.custom-attribution a:hover) {
  opacity: 1;
  border-bottom-style: solid;
}

:global(.ol-zoom.custom-zoom) {
  position: absolute !important;
  top: 14px !important;   /* zelfde hoogte als menuknop */
  right: 14px !important; /* optioneel: matcht menuknop spacing */
  left: auto !important;
  bottom: auto !important;
  z-index: 1000 !important;
}


:global(.custom-zoom button) {
  background: rgba(255, 255, 255, 0.742);
}

:global(.custom-zoom button:hover) {
  background: rgba(255, 255, 255, 0.9);
}

/* DARK MODE – zachte transparante UI zoals de menuknop */
:global([data-theme='dark'] .custom-zoom button) {
  background: rgba(0, 0, 0, 0.45);       /* zelfde base als menuknop */
  color: var(--color-text);              /* licht, leesbaar */
  border: 1px solid rgba(255, 255, 255, 0.15);  /* subtiele lichte rand */
}

/* Hover – koperaccent zoals de menuknop */
:global([data-theme='dark'] .custom-zoom button:hover) {
  background: rgba(0, 0, 0, 0.65);
  color: var(--color-primary);
  border-color: var(--color-primary-soft);
}

</style>
