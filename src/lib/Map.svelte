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
    Icon,
    Style,
    Text,
    Fill,
    Stroke,
    Circle as CircleStyle,
  } from 'ol/style';
  import { defaults as defaultControls, Attribution, Zoom } from 'ol/control';
  import 'ol/ol.css';

  type Marker = {
    lon: number;
    lat: number;
    place?: string;
    song?: string;
    artist?: string;
    description?: string;
    youtubeId?: string;
  };

  export let markers: Marker[] = [];
  export let resetSignal = 0;
  export let activeMarker: Marker | null = null; // 🆕 nieuw toegevoegd

  let mapElement: HTMLDivElement;
  let map: Map;
  let view: View;
  let nlExtent: number[];
  let clusterLayer: VectorLayer<Cluster>;
  let lastZoomBeforeSelect: number | null = null;

  const dispatch = createEventDispatcher();

  const MAPTILER_KEY = 'p2dtQSug5uMMSMPkxDKK';
  const LABEL_ZOOM_THRESHOLD = 7;
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
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        ],
      }),
    });

    const nlCenter = fromLonLat([5.3, 52.2]);
    view = new View({
      projection,
      center: nlCenter,
      zoom: DEFAULT_ZOOM,
      minZoom: 6,
      maxZoom: 13,
      extent: nlExtent,
      constrainOnlyCenter: true,
    });

    map = new Map({
      target: mapElement,
      layers: [baseLayer],
      view,
      controls: defaultControls({ zoom: false, attribution: false }).extend([
        new Zoom({ className: 'ol-zoom custom-zoom' }),
        new Attribution({
          collapsible: true,
          collapsed: true,
          className: 'ol-attribution custom-attribution',
        }),
      ]),
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

  function renderClusters() {
    if (!map || !markers || markers.length === 0) return;
    const validMarkers = markers.filter((m) => !isNaN(m.lon) && !isNaN(m.lat));
    if (validMarkers.length === 0) return;

    const features = validMarkers.map(
      (m) =>
        new Feature({
          geometry: new Point(fromLonLat([m.lon, m.lat])),
          marker: m,
        })
    );

    const clusterSource = new Cluster({
      distance: 30,
      source: new VectorSource({ features }),
    });

    const clusterStyleFunction = (feature) => {
      const clustered = feature.get('features');
      const size = clustered.length;
      const zoom = view?.getZoom?.() ?? 0;

      if (size > 1) {
        return new Style({
          image: new CircleStyle({
            radius: 14 + Math.min(size, 30) / 3,
            fill: new Fill({ color: 'rgba(92, 111, 130, 0.85)' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({ color: '#fff' }),
            font: '600 12px "Inter", sans-serif',
          }),
        });
      } else {
        const marker = clustered[0].get('marker') as Marker;
        const textStyle =
          zoom >= LABEL_ZOOM_THRESHOLD
            ? new Text({
                text: marker.place ?? '(onbekend)',
                offsetY: 8,
                textAlign: 'center',
                textBaseline: 'top',
                font: '600 13px "Inter", sans-serif',
                fill: new Fill({ color: '#333' }),
                stroke: new Stroke({ color: '#fff', width: 3 }),
              })
            : undefined;

        return new Style({
          image: new Icon({
            src: '/pin.png',
            scale: 0.07,
            anchor: [0.5, 1],
          }),
          text: textStyle,
          hitDetection: new CircleStyle({
            radius: 12,
            fill: new Fill({ color: 'rgba(0,0,0,0.001)' }),
          }),
        });
      }
    };

    if (clusterLayer) map.removeLayer(clusterLayer);
    clusterLayer = new VectorLayer({ source: clusterSource, style: clusterStyleFunction });
    map.addLayer(clusterLayer);
  }

  function updateClusterLabels() {
    if (clusterLayer) clusterLayer.changed();
  }

  function handleMapClick(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, { hitTolerance: 10 });
    if (!feature) return;
    const clustered = feature.get('features');
    if (!clustered) return;

    if (clustered.length > 1) {
      view.animate({
        center: evt.coordinate,
        zoom: Math.min((view.getZoom() ?? DEFAULT_ZOOM) + 1.2, view.getMaxZoom() ?? 13),
        duration: 400,
      });
    } else {
      const marker = clustered[0].get('marker') as Marker;
      const coords = clustered[0].getGeometry().getCoordinates();
      lastZoomBeforeSelect = view.getZoom() ?? DEFAULT_ZOOM;
      view.animate({ center: coords, zoom: SELECT_ZOOM, duration: 600 }, () => dispatch('select', marker));
    }
  }

  // 🔁 Reageer op prop-wijzigingen
  $: if (map && markers) renderClusters();
  $: if (view && resetSignal > 0) {
    const zoomTerug = lastZoomBeforeSelect ?? DEFAULT_ZOOM;
    view.animate({ zoom: zoomTerug, duration: 600 });
  }

  // 🆕 Automatisch centreren bij wijziging van activeMarker
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
  }

  .custom-attribution {
    font-size: 11px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 6px;
    padding: 3px 6px;
    backdrop-filter: blur(4px);
  }

  .ol-overlaycontainer-stopevent .ol-attribution.custom-attribution {
    position: absolute !important;
    right: 10px !important;
    bottom: 10px !important;
    left: auto !important;
    top: auto !important;
  }

  .ol-overlaycontainer-stopevent .custom-zoom {
    position: absolute !important;
    right: 10px !important;
    bottom: 50px !important;
    top: auto !important;
    left: auto !important;
  }

  .custom-zoom button {
    background: rgba(255, 255, 255, 0.6);
    color: #333;
    border: none;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    font-size: 20px;
    cursor: pointer;
    margin: 2px 0;
    transition: background 0.2s ease;
  }

  .custom-zoom button:hover {
    background: rgba(255, 255, 255, 0.85);
  }
</style>
