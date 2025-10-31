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
  import { Icon, Style, Text, Fill, Stroke } from 'ol/style';
  import { defaults as defaultControls } from 'ol/control';

  export let markers: any[] = [];
  export let resetSignal = 0;

  let mapElement: HTMLDivElement;
  const dispatch = createEventDispatcher();
  let view: View;
  let nlExtent: number[];
  let map: Map;

  const MAPTILER_KEY = "p2dtQSug5uMMSMPkxDKK";

  onMount(() => {
    const nlExtentWGS84 = [3.0, 50.7, 7.3, 53.7];
    const projection = getProjection('EPSG:3857');
    nlExtent = transformExtent(nlExtentWGS84, 'EPSG:4326', projection);

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.maptiler.com/maps/aquarelle/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
      }),
    });

    // MARKERS: bewaar hele object als `marker`
    const features = markers.map((m) => {
      const f = new Feature({
        geometry: new Point(fromLonLat([m.lon, m.lat])),
        marker: m, // HELE marker bewaren!
      });

      f.setStyle(
        new Style({
          image: new Icon({
            src: '/pin.png',
            scale: 0.07,
            anchor: [0.5, 1],
          }),
          text: new Text({
            text: m.place, // Gebruik `place` als label
            offsetY: -15,
            font: '600 13px "Inter", sans-serif',
            fill: new Fill({ color: '#333' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
          }),
        })
      );
      return f;
    });

    const markerLayer = new VectorLayer({
      source: new VectorSource({ features }),
    });

    const nlCenter = fromLonLat([5.3, 52.2]);
    view = new View({
      projection,
      center: nlCenter,
      zoom: 7.4,
      minZoom: 6,
      maxZoom: 13,
      extent: nlExtent,
      constrainOnlyCenter: true,
    });

    map = new Map({
      target: mapElement,
      layers: [baseLayer, markerLayer],
      view,
      controls: defaultControls({ attribution: false, zoom: false }),
    });

    // Fit Nederland bij laden
    const tryFit = () => {
      const size = map.getSize();
      if (!size || size[0] === 0) {
        requestAnimationFrame(tryFit);
        return;
      }
      view.fit(nlExtent, { size, padding: [40, 40, 40, 40], duration: 0 });
      view.setZoom(7.4);
    };
    setTimeout(tryFit, 300);

    // KLIK: dispatch hele marker
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (!feature) return;

      const marker = feature.get('marker');
      if (!marker) return;

      const coords = feature.getGeometry().getCoordinates();

      view.animate(
        { center: coords, zoom: 11, duration: 800 },
        () => dispatch('select', marker) // HELE OBJECT
      );
    });

    // Cursor
    map.on('pointermove', (evt) => {
      map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel)
        ? 'pointer'
        : '';
    });

    // Beperk tot NL
    map.on('moveend', () => {
      const center = view.getCenter();
      if (!center) return;
      const extent = view.calculateExtent(map.getSize());
      const exceeds = !(
        extent[0] >= nlExtent[0] &&
        extent[2] <= nlExtent[2] &&
        extent[1] >= nlExtent[1] &&
        extent[3] <= nlExtent[3]
      );
      if (exceeds) {
        view.fit(nlExtent, { size: map.getSize(), duration: 300 });
      }
    });
  });

  // Reset zoom bij sluiten
  $: if (view && resetSignal > 0) {
    view.animate({
      center: [(nlExtent[0] + nlExtent[2]) / 2, (nlExtent[1] + nlExtent[3]) / 2],
      zoom: 7.4,
      duration: 1000,
    });
  }
</script>

<style>
  #map {
    width: 100%;
    height: 100%;
    position: fixed;
    inset: 0;
    background-color: #f0f0f0;
  }

  :global(html, body, main, #__layout) {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .custom-attribution {
    position: fixed;
    right: 10px;
    bottom: 6px;
    background: rgba(255, 255, 255, 0.75);
    border-radius: 6px;
    font-size: 11px;
    padding: 2px 6px;
    color: #333;
    line-height: 1.3;
    z-index: 1000;
  }

  .custom-attribution a {
    color: #3366cc;
    text-decoration: none;
  }

  .custom-attribution a:hover {
    text-decoration: underline;
  }
</style>

<div bind:this={mapElement} id="map"></div>

<div class="custom-attribution">
  © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> & MapTiler
</div>