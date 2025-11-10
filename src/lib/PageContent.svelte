<script lang="ts">
  import Map from '$lib/components/Map.svelte';
  import { getMarkers } from '$lib/getMarkers';
  import { onMount, tick, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import type { Marker } from '$lib/types';

  import Sidebar from '$lib/components/Sidebar.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import SongModal from '$lib/components/SongModal.svelte';

  // ------------------------------
  // 🔧 STATE
  // ------------------------------
  let markers: Marker[] = [];
  let selectedPlace: Marker | null = null;
  let resetSignal = 0;
  let loading = true;
  let menuOpen = false;
  let searchQuery = '';
  let listMode: 'plaats' | 'artiest' = 'plaats';
  let openArtists = new Set<string>();

  // ------------------------------
  // 📦 DATA + ROUTE LOGICA
  // ------------------------------
  onMount(async () => {
    try {
      markers = await getMarkers();


      const updateFromUrl = () => {
        const path = decodeURIComponent(location.pathname.slice(1));
        const match = markers.find(
          (m) => m.place?.toLowerCase() === path.toLowerCase()
        );
        selectedPlace = match || null;
      };

      updateFromUrl();
      window.addEventListener('popstate', updateFromUrl);
    } catch (err) {
      
    } finally {
      loading = false;
    }

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
      window.removeEventListener('popstate', () => {});
    };
  });

  // ------------------------------
  // 🎵 NAVIGATIE + SELECTIE
  // ------------------------------
  async function handleSelect(event: CustomEvent) {
    const place = event.detail as Marker;
    selectedPlace = null;
    await tick();
    selectedPlace = place;
    history.pushState({}, '', `/${encodeURIComponent(place.place || '')}`);
    
  }

  function openPlace(marker: Marker) {
    selectedPlace = marker;
    
    menuOpen = false;
    history.pushState({}, '', `/${encodeURIComponent(marker.place || '')}`);
  }

  function closeModal() {
    selectedPlace = null;
    resetSignal += 1;
    history.pushState({}, '', '/');
  }

  function nextSong() {
    if (!selectedPlace || !markers.length) return;
    const idx = markers.findIndex((m) => m === selectedPlace);
    selectedPlace = markers[(idx + 1) % markers.length];
    history.pushState({}, '', `/${encodeURIComponent(selectedPlace.place || '')}`);
  }

  function prevSong() {
    if (!selectedPlace || !markers.length) return;
    const idx = markers.findIndex((m) => m === selectedPlace);
    selectedPlace = markers[(idx - 1 + markers.length) % markers.length];
    history.pushState({}, '', `/${encodeURIComponent(selectedPlace.place || '')}`);
  }

  function toggleArtist(artist: string) {
    const next = new Set(openArtists);
    next.has(artist) ? next.delete(artist) : next.add(artist);
    openArtists = next;
  }

  // ------------------------------
  // ⚙️ UI BEHAVIOR
  // ------------------------------
  afterUpdate(() => {
    if (browser && selectedPlace) {
      document.title = `Liedjeskaart - ${selectedPlace.place}`;
    } else if (browser) {
      document.title = 'Liedjeskaart van Nederland';
    }
  });
</script>

<style src="$lib/PageContent.css"></style>

<!-- ------------------------------ -->
<!-- 💿 LAADSTATUS -->
<!-- ------------------------------ -->
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
