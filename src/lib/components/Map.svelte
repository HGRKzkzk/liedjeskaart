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
  import {
    Style,
    Text,
    Fill,
    Stroke,
    Circle as CircleStyle
  } from 'ol/style';
  import { defaults as defaultControls, Attribution, Zoom } from 'ol/control';
  import { easeOut } from 'ol/easing';
  import 'ol/ol.css';

  import { LineString } from 'ol/geom';
  

  import type { Marker } from '$lib/types';

  export let markers: Marker[] = [];
  export let resetSignal = 0;
  export let activeMarker: Marker | null = null;

  let mapElement: HTMLDivElement;
  let map: Map;
  let view: View;
  let nlExtent: number[];
  let clusterLayer: VectorLayer<Cluster>;
  let lastZoomBeforeSelect: number | null = null;

  const dispatch = createEventDispatcher();

  const MAPTILER_KEY = 'lzknyttwstKLqQUfEgLx'; // x
  const LABEL_ZOOM_THRESHOLD = 9.6;
  const DEFAULT_ZOOM = 7.4;
  const SELECT_ZOOM = 12;

  onMount(() => {
    const nlExtentWGS84 = [3.0, 50.7, 7.3, 53.7];
    const projection = getProjection('EPSG:3857');
    nlExtent = transformExtent(nlExtentWGS84, 'EPSG:4326', projection);

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.maptiler.com/maps/aquarelle/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        attributions: [
          '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>',
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        ]
      })
    });

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

    map.once('postrender', () => {
      const zoomEl = mapElement.querySelector('.custom-zoom') as HTMLElement;
      if (zoomEl) {
        zoomEl.style.position = 'absolute';
        zoomEl.style.top = '10px';
        zoomEl.style.right = '10px';
        zoomEl.style.left = 'auto';
        zoomEl.style.bottom = 'auto';
      }
    });

    map.on('pointermove', (e) => {
      const hit = map.hasFeatureAtPixel(e.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    const fitToNL = () => {
      const size = map.getSize();
      if (!size || size[0] === 0) {
        requestAnimationFrame(fitToNL);
        return;
      }
      view.fit(nlExtent, { size, padding: [40, 40, 40, 40], duration: 0 });
      view.setZoom(DEFAULT_ZOOM);
    };
    map.once('postrender', fitToNL);

    map.on('click', handleMapClick);
    view.on('change:resolution', () => updateClusterLabels());
  });

  // 🎨 Clusters en markers in retrostijl
  function renderClusters() {
    if (!map || !markers || markers.length === 0) return;
    const validMarkers = markers.filter((m) => !isNaN(m.lon) && !isNaN(m.lat));
    if (validMarkers.length === 0) return;

    const features = validMarkers.map(
      (m) =>
        new Feature({
          geometry: new Point(fromLonLat([m.lon, m.lat])),
          marker: m
        })
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


      const primary = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim() || '#e67e22';

      const primarySoft = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-soft')
        .trim() || '#f3d7b0';

      // 🟠 Cluster van meerdere markers
      if (size > 1) {
        return new Style({
          image: new CircleStyle({
            radius: 14 + Math.min(size, 30) / 3,
            fill: new Fill({ color: primarySoft }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({ color: '#2f2f2f' }),
            font: `600 12px ${fontBody}`
          })
        });
      }

      // 🔸 Enkele marker — minimalistische retrocirkel
      const marker = clustered[0].get('marker') as Marker;
      const textStyle =
        zoom >= LABEL_ZOOM_THRESHOLD
          ? new Text({
              text: marker.place ?? '(onbekend)',
              offsetY: 10,
              textAlign: 'center',
              textBaseline: 'top',
              font: `600 13px ${fontBody}, sans-serif`,
              fill: new Fill({ color: '#2f2f2f' }),
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

  function handleMapClick(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
      hitTolerance: 10
    });
    if (!feature) return;
    const clustered = feature.get('features');
    if (!clustered) return;

    if (clustered.length > 1) {
      view.animate({
        center: evt.coordinate,
        zoom: Math.min(
          (view.getZoom() ?? DEFAULT_ZOOM) + 1.2,
          view.getMaxZoom() ?? 13
        ),
        duration: 400
      });
    } else {
      const marker = clustered[0].get('marker') as Marker;
      const coords = clustered[0].getGeometry().getCoordinates();
      lastZoomBeforeSelect = view.getZoom() ?? DEFAULT_ZOOM;
      view.animate(
        { center: coords, zoom: SELECT_ZOOM, duration: 600 },
        () => dispatch('select', marker)
      );
    }
  }

  $: if (map && markers) renderClusters();

  $: if (view && resetSignal > 0) {
    const zoomTerug = lastZoomBeforeSelect ?? DEFAULT_ZOOM;
    const nlCenter = fromLonLat([5.3, 52.2]);
    view.animate({
      center: nlCenter,
      zoom: zoomTerug,
      duration: 800,
      easing: easeOut
    });
  }

  $: if (map && activeMarker) {
    const coords = fromLonLat([activeMarker.lon, activeMarker.lat]);
    view.animate({ center: coords, zoom: SELECT_ZOOM, duration: 600 });
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
  mask-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 1) 72%,
    rgba(0, 0, 0, 0.7) 85%,
    rgba(0, 0, 0, 0.25) 100%
  );
  mask-mode: alpha;
  -webkit-mask-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 1) 72%,
    rgba(0, 0, 0, 0.7) 85%,
    rgba(0, 0, 0, 0.25) 100%
  );
  -webkit-mask-mode: alpha;
  transition: mask-image 0.4s ease, background 0.4s ease;
}

/* 🪶 Attribution rechts-onder */
.ol-control.ol-attribution.custom-attribution {
  background: rgba(255, 255, 255, 0.45) !important;
  color: rgba(0, 0, 0, 0.45) !important;
  font-size: 11px !important;
  border-radius: 8px !important;
  padding: 2px 6px !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: blur(4px);
  right: 10px !important;
  bottom: 10px !important;
}
.ol-attribution.custom-attribution a {
  color: rgba(0, 0, 0, 0.55) !important;
  text-decoration: none !important;
}
.ol-attribution.custom-attribution a:hover {
  color: rgba(0, 0, 0, 0.8) !important;
  text-decoration: underline !important;
}

/* 📍 Zoom rechtsboven */
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
