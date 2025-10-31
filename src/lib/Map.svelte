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
      layers: [baseLayer],
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
  });

  // Reageer op veranderingen in markers
  $: if (map && markers && markers.length > 0) {
    console.log('🗺️ Nieuwe markers ontvangen:', markers);

    const features = markers
      .map((m) => {
        if (isNaN(m.lon) || isNaN(m.lat)) {
          console.warn('⚠️ Marker met ongeldige coördinaten overgeslagen:', m);
          return null;
        }

        // ✅ Fallbacks voor kolomnamen
        const normalizedMarker = {
          place: m.place || m.plaats || '(onbekend)',
          lon: m.lon,
          lat: m.lat,
          song: m.song || m.lied || '',
          artist: m.artist || m.artiest || '',
          description: m.description || m.omschrijving || '',
          youtubeId: m.youtubeId || m.youtube || '',
        };

        const feature = new Feature({
          geometry: new Point(fromLonLat([normalizedMarker.lon, normalizedMarker.lat])),
          marker: { ...normalizedMarker }, // diepte kopie voorkomt lege modals
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: '/pin.png',
              scale: 0.07,
              anchor: [0.5, 1],
            }),
            text: new Text({
              text: normalizedMarker.place,
              offsetY: -15,
              font: '600 13px "Inter", sans-serif',
              fill: new Fill({ color: '#333' }),
              stroke: new Stroke({ color: '#fff', width: 3 }),
            }),
          })
        );

        return feature;
      })
      .filter(Boolean);

    const source = new VectorSource({ features });

    // Oude markerlaag vervangen
    const existingMarkerLayer = map
      .getLayers()
      .getArray()
      .find((l) => l.get('name') === 'markers');
    if (existingMarkerLayer) map.removeLayer(existingMarkerLayer);

    const markerLayer = new VectorLayer({
      source,
    });
    markerLayer.set('name', 'markers');
    map.addLayer(markerLayer);

    // Klik → dispatch volledige marker
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (!feature) return;

      const marker = feature.get('marker');
      console.log('🧭 Feature geklikt:', feature);
      console.log('📦 marker data uit feature:', marker);

      if (!marker) return;

      const coords = feature.getGeometry().getCoordinates();
      view.animate(
        { center: coords, zoom: 11, duration: 800 },
        () => {
          console.log('📤 Dispatching select event met marker:', marker);
          dispatch('select', marker);
        }
      );
    });
  }

  // Reset zoom bij sluiten modal
  $: if (view && resetSignal > 0) {
    view.animate({
      center: [(nlExtent[0] + nlExtent[2]) / 2, (nlExtent[1] + nlExtent[3]) / 2],
      zoom: 7.4,
      duration: 1000,
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
  }
</style>
