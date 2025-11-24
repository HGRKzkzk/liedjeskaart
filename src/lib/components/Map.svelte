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
      zoomEl.style.top = '10px';
      zoomEl.style.right = '10px';
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

    /* THEMA SWITCH — ⭐ DIRECTE RERENDER FIX */
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.dataset.theme;
      if (newTheme && newTheme !== currentTheme) {
        currentTheme = newTheme;

        // vervang tiles
        map.removeLayer(baseLayer);
        baseLayer = createBaseLayer(newTheme);
        map.getLayers().insertAt(0, baseLayer);

        // ⭐ NIEUW: clusters meteen verversen
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

      const textColor = root.getPropertyValue('--color-cluster-text').trim() || '#2f2f2f';

      if (size > 1) {
        return new Style({
          image: new CircleStyle({
            radius: 14 + Math.min(size, 30) / 3,
            fill: new Fill({ color: primarySoft }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({ color: textColor }),
            font: `600 12px ${fontBody}`
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
              fill: new Fill({ color: textColor }),
              stroke: new Stroke({ color: '#fff', width: 3 })
            })
          : undefined;

      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: primary }),
          stroke: new Stroke({ color: '#fff', width: 2 })
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
      CLICK HANDLING
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
      const marker = clustered[0].get('marker') as Marker;
      dispatch('select', marker);
    }
  }

  /* ------------------------------
      REACTIVE BLOCKS
  ------------------------------ */
  $: if (map && markers) renderClusters();

  $: if (mapInitialized && view && resetSignal !== lastResetSignal) {
    const current = resetSignal;
    lastResetSignal = current;

    if (current > 0) {
      const targetCenter = lastViewCenterBeforeSelect ?? fromLonLat([5.3, 52.2]);
      const targetZoom = lastZoomBeforeSelect ?? DEFAULT_ZOOM;

      animateWithLock(
        { center: targetCenter, zoom: targetZoom, duration: 800, easing: easeOut },
        () => {
          lastZoomBeforeSelect = null;
          lastViewCenterBeforeSelect = null;
        }
      );
    }
  }

  $: if (map && activeMarker && mapInitialized && !zoomLocked) {
    if (lastZoomBeforeSelect === null || lastViewCenterBeforeSelect === null) {
      lastZoomBeforeSelect = view.getZoom() ?? DEFAULT_ZOOM;
      lastViewCenterBeforeSelect = view.getCenter() ?? fromLonLat([5.3, 52.2]);
    }

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

  .ol-zoom.custom-zoom {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    left: auto !important;
    bottom: auto !important;
    z-index: 1000 !important;
  }

  .custom-zoom {
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .custom-zoom button {
    background: rgba(255, 255, 255, 0.65);
    color: #333;
    border: none;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    font-size: 22px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease;
  }

  .custom-zoom button:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: scale(1.05);
  }

  @media (max-width: 700px) {
    .custom-zoom button {
      width: 46px;
      height: 46px;
      font-size: 24px;
    }
  }
</style>
