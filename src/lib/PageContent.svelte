<script lang="ts">
  import ContactModal from '$lib/components/ContactModal.svelte';
  import Map from '$lib/components/Map.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import SongModal from '$lib/components/SongModal.svelte';

  import { onMount, tick, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';

  import type { Marker } from '$lib/types';
  import { loadMarkers } from '$lib/loadMarkers';

  // -----------------------------------------
  // 🧱 STATE
  // -----------------------------------------
  let markers: Marker[] = [];
  let contactOpen = false;
  let selectedPlace: Marker | null = null;
  let resetSignal = 0;
  let loading = true;

  let menuOpen = false;
  let searchQuery = '';
  let listMode: 'plaats' | 'artiest' = 'plaats';
  let openArtists = new Set<string>();

  // -----------------------------------------
  // 🧭 NAVIGATIE HELPERS
  // -----------------------------------------
  function gotoPlace(placeName: string) {
    const encoded = encodeURIComponent(placeName.toLowerCase());
    const to = base ? `${base}/${encoded}/` : `/${encoded}/`;

    // voorkom onnodige navigatie-lussen
    if (browser && location.pathname === to) return;

    goto(to, { replaceState: false, keepfocus: true, noscroll: true });
  }

  function gotoHome() {
    const to = base ? `${base}/` : '/';

    if (browser && location.pathname === to) return;

    goto(to, { replaceState: false, keepfocus: true, noscroll: true });
  }

  // -----------------------------------------
  // 🔍 URL → PLACE LOGICA
  // -----------------------------------------
  function updateFromUrl() {
    if (!browser) return;

    let fullPath = decodeURIComponent(location.pathname).toLowerCase();
    const basePath = base ? (base.endsWith('/') ? base : base + '/') : '';

    if (basePath && fullPath.startsWith(basePath)) {
      fullPath = fullPath.slice(basePath.length);
    } else {
      fullPath = fullPath.replace(/^\//, '');
    }

    fullPath = fullPath.replace(/\/$/, '');

    if (!fullPath) {
      selectedPlace = null;
      return;
    }

    const match = markers.find(
      (m) => m.place?.toLowerCase() === fullPath
    );

    selectedPlace = match || null;
  }

  // -----------------------------------------
  // 📦 INITIALISATIE
  // -----------------------------------------
  onMount(async () => {
    try {
      // ⭐ Centrale loader: API (dev/Node) → fallback JSON (static)
      markers = await loadMarkers();

      // Intro-contact 1x
      if (browser) {
        const visited = localStorage.getItem('contactIntroSeen');
        if (!visited) {
          contactOpen = true;
          localStorage.setItem('contactIntroSeen', 'true');
        }
      }

      updateFromUrl();
      window.addEventListener('popstate', updateFromUrl);

    } catch (err) {
      console.error('Fout bij laden markers:', err);
    } finally {
      loading = false;
    }

    // Keyboard navigatie
    const keyHandler = (e: KeyboardEvent) => {
      if (menuOpen && e.key === 'Escape') return (menuOpen = false);
      if (!selectedPlace) return;

      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowRight') nextSong();
      else if (e.key === 'ArrowLeft') prevSong();
    };

    window.addEventListener('keydown', keyHandler);

    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('popstate', updateFromUrl);
    };
  });

  // -----------------------------------------
  // 🎵 SONG / PLACE NAVIGATIE
  // -----------------------------------------
  async function handleSelect(event: CustomEvent) {
    const place = event.detail as Marker;
    selectedPlace = null;
    await tick();
    selectedPlace = place;
    gotoPlace(place.place || '');
  }

  function openPlace(marker: Marker) {
    selectedPlace = marker;
    menuOpen = false;
    gotoPlace(marker.place || '');
  }

  function closeModal() {
    selectedPlace = null;
    resetSignal += 1;
    gotoHome();
  }

  function nextSong() {
    if (!selectedPlace || !markers.length) return;
    const idx = markers.findIndex((m) => m === selectedPlace);
    selectedPlace = markers[(idx + 1) % markers.length];
    gotoPlace(selectedPlace.place || '');
  }

  function prevSong() {
    if (!selectedPlace || !markers.length) return;
    const idx = markers.findIndex((m) => m === selectedPlace);
    selectedPlace = markers[(idx - 1 + markers.length) % markers.length];
    gotoPlace(selectedPlace.place || '');
  }

  function toggleArtist(artist: string) {
    const next = new Set(openArtists);
    next.has(artist) ? next.delete(artist) : next.add(artist);
    openArtists = next;
  }

  // -----------------------------------------
  // 🖼️ TITEL UPDATES
  // -----------------------------------------
  afterUpdate(() => {
    if (!browser) return;

    document.title = selectedPlace
      ? `Liedjeskaart - ${selectedPlace.place}`
      : 'Liedjeskaart van Nederland';
  });
</script>

<style src="$lib/PageContent.css"></style>

{#if loading}
  <Spinner />
{:else}
  <Map
    {markers}
    bind:resetSignal
    activeMarker={selectedPlace}
    on:select={handleSelect}
  />

  {#if !menuOpen}
    <button class="menu-toggle" on:click={() => (menuOpen = true)}>☰</button>
  {/if}

  <Sidebar
    {menuOpen}
    {listMode}
    {searchQuery}
    {selectedPlace}
    {markers}
    {openArtists}
    on:openPlace={(e) => openPlace(e.detail)}
    on:toggleArtist={(e) => toggleArtist(e.detail)}
    on:closeMenu={() => (menuOpen = false)}
    on:setListMode={(e) => (listMode = e.detail)}
    on:setSearch={(e) => (searchQuery = e.detail)}
    on:openContact={() => (contactOpen = true)}
  />

  {#if selectedPlace}
    <SongModal
      {selectedPlace}
      on:close={closeModal}
      on:prev={prevSong}
      on:next={nextSong}
    />
  {/if}
{/if}

<ContactModal
  bind:open={contactOpen}
  on:close={() => (contactOpen = false)}
/>
