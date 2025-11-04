<script lang="ts">
  import Map from '$lib/Map.svelte';
  import { getMarkersFromApi } from '$lib/sheetClient';
  import { fade, scale, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount, tick, afterUpdate } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  type Marker = {
    lon: number;
    lat: number;
    place?: string;
    song?: string;
    artist?: string;
    description?: string;
    youtubeId?: string;
  };

  let markers: Marker[] = [];
  let selectedPlace: Marker | null = null;
  let resetSignal = 0;
  let loading = true;
  let closeButton: HTMLButtonElement | null = null;
  let menuOpen = false;
  let searchQuery = '';
  let touchStartX: number | null = null;
  let touchStartY: number | null = null;
  let modalEl: HTMLDivElement | null = null;

  // --- Data ophalen + route logica ---
  onMount(async () => {
    try {
      markers = await getMarkersFromApi();
      markers.sort((a, b) => a.lon - b.lon);

      // Route naar plaats → open modal
      const currentPath = get(page).params.path?.trim() || '';
      if (currentPath && markers.length) {
        const match = markers.find(
          (m) => m.place?.toLowerCase() === decodeURIComponent(currentPath.toLowerCase())
        );
        if (match) selectedPlace = match;
      }
    } catch (err) {
      console.error('❌ Fout bij ophalen markers:', err);
    } finally {
      loading = false;
    }

    const keyHandler = (e: KeyboardEvent) => {
      if (menuOpen && e.key === 'Escape') {
        menuOpen = false;
        return;
      }
      if (!selectedPlace) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowRight') nextSong();
      else if (e.key === 'ArrowLeft') prevSong();
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  });

  // --- Swipe controls ---
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) prevSong();
      else nextSong();
    }
    touchStartX = null;
    touchStartY = null;
  }

  // --- Navigatie / selectie ---
  async function handleSelect(event: CustomEvent) {
    const place = event.detail;
    selectedPlace = null;
    await tick();
    selectedPlace = place;
    history.pushState({}, '', `/${encodeURIComponent(place.place || '')}`);
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

  function openPlace(marker: Marker) {
    selectedPlace = marker;
    menuOpen = false;
    history.pushState({}, '', `/${encodeURIComponent(marker.place || '')}`);
  }

  // --- Filter + groepeer ---
  $: filteredMarkers = markers.filter((m) =>
    (m.place || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  $: groupedMarkers = (() => {
    const sorted = [...filteredMarkers].sort((a, b) =>
      (a.place || '').localeCompare(b.place || '')
    );
    const groups: Record<string, Marker[]> = {};
    for (const m of sorted) {
      const firstLetter = (m.place?.[0] || '?').toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(m);
    }
    return groups;
  })();

  afterUpdate(() => {
    if (selectedPlace && closeButton) closeButton.focus();
  });
</script>

{#if loading}
  <div class="loading" transition:fade>
    <div class="spinner"></div>
    <p>Bezig met laden…</p>
  </div>
{:else}
  <Map {markers} bind:resetSignal activeMarker={selectedPlace} on:select={handleSelect} />

  {#if !menuOpen}
    <button class="menu-toggle" on:click={() => (menuOpen = true)}>☰</button>
  {/if}

  {#if menuOpen}
    <div
      class="menu-overlay"
      in:fade={{ duration: 250 }}
      out:fade={{ duration: 200 }}
      on:click={() => (menuOpen = false)}
    ></div>

    <aside
      class="side-menu"
      in:slide={{ duration: 250, easing: cubicOut }}
      out:slide={{ duration: 200, easing: cubicOut }}
    >
      <!-- Sticky topbar -->
      <div class="menu-topbar">
        <button class="menu-close" on:click={() => (menuOpen = false)}>×</button>
      </div>

      <!-- Contactinfo boven de zoekbalk -->
      <div class="menu-header">
        <h2>Over dit project</h2>
        <p><strong>Naam:</strong> Jouw Naam</p>
        <p>
          <strong>Contact:</strong>
          <a href="mailto:jouw@email.nl">jouw@email.nl</a>
        </p>
      </div>

      <!-- Zoekbalk -->
      <div class="search-box sticky-search">
        <input
          type="search"
          placeholder="Zoek.."
          bind:value={searchQuery}
        />
      </div>

      <hr />

      <!-- Lijst van plaatsen -->
      <div class="menu-list">
        
        {#if filteredMarkers.length === 0}
          <p class="no-results">Geen resultaten gevonden</p>
        {:else}
          {#each Object.entries(groupedMarkers) as [letter, list]}
            <div class="group">
              <h4>{letter}</h4>
              <ul>
                {#each list as m}
                  <li on:click={() => openPlace(m)} class:selected={selectedPlace === m}>
                    {m.place}
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        {/if}
      </div>
    </aside>
  {/if}
{/if}

{#if selectedPlace}
  <div class="overlay-backdrop" transition:fade on:click={closeModal}></div>

  <div
    class="song-modal"
    bind:this={modalEl}
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
    transition:scale={{ duration: 250 }}
  >
    <button class="close" bind:this={closeButton} on:click={closeModal}>×</button>

    <div class="nav-buttons">
      <button class="nav-btn" on:click={prevSong}>← Vorige</button>
      <div class="place-label">{selectedPlace.place}</div>
      <button class="nav-btn" on:click={nextSong}>Volgende →</button>
    </div><br>


  <h3>{selectedPlace.artist} - {selectedPlace.song}</h3>

    

    {#if selectedPlace.youtubeId}
      <div class="video-wrapper">
        <iframe
          src={`https://www.youtube.com/embed/${selectedPlace.youtubeId}?autoplay=0`}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
    {/if}

    <p>{selectedPlace.description}</p>

</div>
{/if}

<style>
  /* Loading */
  .loading {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    color: #333;
    font-size: 1rem;
    background: #f9fafb;
    z-index: 40;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #666;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Menu */
  .menu-toggle {
    position: fixed;
    top: 14px;
    left: 14px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 10px;
    padding: 0.6rem 0.9rem;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 20;
    transition: transform 0.15s, background 0.15s;
  }

  .menu-toggle:hover { background: #fff; }
  .menu-toggle:active { transform: scale(0.96); }

  .menu-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    z-index: 14;
  }

  .side-menu {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 280px;
    background: #fff;
    box-shadow: 2px 0 20px rgba(15, 23, 42, 0.18);
    z-index: 15;
    overflow-y: auto;
  }

  .menu-topbar {
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
    border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  }

  .menu-close {
    font-size: 1.6rem;
    border: none;
    background: none;
    color: #777;
    cursor: pointer;
    padding: 0.4rem 0.6rem;
    transition: transform 0.15s, color 0.15s;
  }

  .menu-close:hover { color: #000; transform: scale(1.1); }

  .menu-header {
    padding: 1rem 1rem 0.4rem;
  }

  .menu-header h2 {
    margin: 0 0 0.4rem;
    font-size: 1.1rem;
  }

  .menu-header p {
    margin: 0.1rem 0;
    font-size: 0.9rem;
    color: #4b5563;
  }

  .menu-header a {
    color: #2563eb;
    text-decoration: none;
  }

  .menu-header a:hover {
    text-decoration: underline;
  }

  /* Zoekbalk */
  .search-box {
    padding: 0.8rem 1rem 0.8rem;
    border-top: 1px solid rgba(0,0,0,0.05);
    border-bottom: 1px solid rgba(0,0,0,0.05);
    background: rgba(255, 255, 255, 0.98);
    position: sticky;
    top: 45px;
    z-index: 9;
  }

  .search-box input {
    width: 100%;
    padding: 0.55rem 0.75rem;
    border-radius: 7px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    font-size: 0.95rem;
  }

  .menu-list {
    padding: 0 1rem 1.5rem;
    margin-top: 0.5rem;
  }

  .group {
    margin-bottom: 1.4rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  }

  .group h4 {
    position: sticky;
    top: 120px;
    margin: 0.4rem 0 0.35rem;
    padding: 0.2rem 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    background: rgba(255,255,255,0.96);
  }

  .menu-list li {
    padding: 0.45rem 0.5rem 0.45rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .menu-list li:hover { background: rgba(15, 23, 42, 0.05); }
  .menu-list li.selected { background: #e0ecff; color: #1d4ed8; font-weight: 600; }

  /* Modal */
  .overlay-backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(3px);
    z-index: 30;
  }

  .song-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.35);
    padding: 2rem;
    width: min(90%, 600px);
    z-index: 31;
  }

  .video-wrapper {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    border-radius: 10px;
    margin-bottom: 1rem;
    background: #000;
  }

  .video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .close {
    position: absolute;
    top: -4px;
    right: 12px;
    font-size: 1.6rem;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    transition: transform 0.2s ease, color 0.2s ease;
    z-index: 32;
  }

  .close:hover {
    color: #000;
    transform: scale(1.1);
  }

  .nav-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.2rem;
    gap: 0.8rem;
  }

  .nav-btn {
    background: #f3f4f6;
    border: none;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    color: #111827;
  }

  .nav-btn:hover {
    background: #e5e7eb;
  }

  .place-label {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 500;
    color: #374151;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
