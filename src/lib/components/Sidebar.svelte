<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Marker } from '$lib/types';
  import Fuse from 'fuse.js';

  export let menuOpen = false;
  export let listMode: 'plaats' | 'artiest' = 'plaats';
  export let searchQuery = '';
  export let selectedPlace: Marker | null = null;
  export let markers: Marker[] = [];
  export let openArtists = new Set<string>();

  const dispatch = createEventDispatcher();
  const closeMenu = () => dispatch('closeMenu');
  const setListMode = (mode: 'plaats' | 'artiest') => dispatch('setListMode', mode);
  const setSearch = (value: string) => dispatch('setSearch', value);
  const openPlace = (marker: Marker) => dispatch('openPlace', marker);
  const toggleArtist = (artist: string) => dispatch('toggleArtist', artist);

  const fuseOptions = {
    keys: [{ name: 'place', weight: 0.6 }],
    threshold: 0.22,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 3
  };

  let fuse: Fuse<Marker> | null = null;

  $: if (markers?.length) {
    fuse = new Fuse(markers, fuseOptions);
  }

  $: filteredMarkers = (() => {
    if (!markers) return [];

    if (!searchQuery.trim()) {
      return listMode === 'plaats'
        ? [...markers].sort((a, b) => (a.place || '').localeCompare(b.place || ''))
        : [...markers].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    }

    const results = fuse?.search(searchQuery) ?? [];
    const items = results.map((r) => r.item);

    return listMode === 'plaats'
      ? items.filter((m) => m.place)
      : items.filter((m) => m.artist);
  })();

  $: groupedMarkers = (() => {
    const sorted = [...filteredMarkers].sort((a, b) =>
      (a.place || '').localeCompare(b.place || '')
    );
    const groups: Record<string, Marker[]> = {};
    for (const m of sorted) {
      const key = (m.place?.[0] || '?').toUpperCase();
      (groups[key] ??= []).push(m);
    }
    return groups;
  })();

  $: artistLetterGroups = (() => {
    if (listMode !== 'artiest') return {};

    const byArtist: Record<string, Marker[]> = {};
    for (const m of filteredMarkers) {
      const name = m.artist || 'Onbekend';
      (byArtist[name] ??= []).push(m);
    }

    const groups: Record<string, [string, Marker[]][]> = {};
    for (const [artist, list] of Object.entries(byArtist)) {
      const letter = (artist[0] || '?').toUpperCase();
      (groups[letter] ??= []).push([artist, list]);
    }

    for (const letter in groups) {
      groups[letter].sort(([a], [b]) => a.localeCompare(b));
    }

    return groups;
  })();

  let darkMode = false;

  onMount(() => {
    darkMode = localStorage.getItem('theme') === 'dark';
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  });

  function toggleTheme() {
    darkMode = !darkMode;
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }

  function pickRandom() {
    if (!markers?.length) return;
    const random = markers[Math.floor(Math.random() * markers.length)];
    dispatch('openPlace', random);
  }
</script>

{#if menuOpen}
  <div class="menu-overlay" in:fade out:fade on:click={closeMenu}></div>

  <aside
    class="side-menu"
    in:slide={{ duration: 250, easing: cubicOut }}
    out:slide={{ duration: 200, easing: cubicOut }}
  >

    <!-- TOPBAR -->
    <div class="menu-topbar">
      <div class="theme-toggle">
        <button on:click={toggleTheme}>
          {#if darkMode} 🌙 Donker {:else} ☀️ Licht {/if}
        </button>
      </div>

      <button class="menu-close" on:click={closeMenu}>×</button>
    </div>

    <!-- HEADER -->
    <div class="menu-header">
      <h2>Liedjeskaart van Nederland</h2>
        <p class="song-count tagline">
    Een interactief overzicht van de {markers.length} mooiste, ontroerendste en grappigste liedjes over Nederland.
  </p>
     <button class="contact-link" on:click={() => dispatch('openContact')}>
        Meer informatie en contact
      </button>
    </div>

    <!-- STICKY SEARCH + TOGGLE -->
    <div class="menu-header-sticky">

      <div class="mode-toggle">
        <button class:selected={listMode === 'plaats'} on:click={() => setListMode('plaats')}>
          Plaatsen
        </button>
        <button class:selected={listMode === 'artiest'} on:click={() => setListMode('artiest')}>
          Artiesten
        </button>
      </div>

      <div class="search-box">
        <input
          type="search"
          placeholder={listMode === 'plaats' ? 'Zoek op plaats…' : 'Zoek op artiest…'}
          value={searchQuery}
          on:input={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

    </div>

    <!-- LIST -->
    <div class="menu-list" transition:fade>

      {#if filteredMarkers.length === 0}
        <p class="no-results">Geen resultaten gevonden</p>

      {:else if listMode === 'plaats'}
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

      {:else}
        {#each Object.entries(artistLetterGroups).sort(([a],[b]) => a.localeCompare(b)) as [letter, entries]}
          <div class="group">
            <h4>{letter}</h4>
            <ul>
              {#each entries as [artist, list]}
                <li>
                  <div
                    class="artist-row"
                    on:click={() =>
                      list.length > 1 ? toggleArtist(artist) : openPlace(list[0])
                    }
                  >
                    <span>{artist}</span>
                    {#if list.length > 1}
                      <span class="artist-arrow">
                        {openArtists.has(artist) ? '▾' : '▸'}
                      </span>
                    {/if}
                  </div>

                  {#if openArtists.has(artist)}
                    <ul in:slide out:slide>
                      {#each list as m}
                        <li on:click={() => openPlace(m)} class:selected={selectedPlace === m}>
                          {m.place}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      {/if}

    </div>

    <!-- RANDOM BUTTON (STICKY) -->
    <div class="random-btn-sticky">
      <button class="random-btn" on:click={pickRandom}>🎲 Willekeurige plaats</button>
    </div>
  </aside>
{/if}

<style>
/* ------------------------------ */
/* OVERLAY */
/* ------------------------------ */
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  backdrop-filter: var(--blur-overlay);
  z-index: 14;
}

/* ------------------------------ */
/* SIDEMENU */
/* ------------------------------ */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 480px;
  max-width: 100%;
  background: var(--color-bg-muted);
  border-right: 2px solid var(--color-border-subtle);
  box-shadow: 3px 0 20px var(--color-shadow);
  display: flex;
  flex-direction: column;
  z-index: 15;
  font-family: var(--font-body);
}

/* ------------------------------ */
/* TOPBAR */
/* ------------------------------ */
.menu-topbar {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg);
  
  padding: 0.1rem 0.8rem;
  z-index: 25;
}

.menu-close {
  font-size: 1.6rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding-right:1rem;
}
.menu-close:hover {
  color: var(--color-text);
  transform: scale(1.1);
}

/* ------------------------------ */
/* THEME SELECTOR */
/* ------------------------------ */
.theme-toggle button {
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.8rem;
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
}
.theme-toggle button:hover {
  background: var(--color-primary-soft);
}

/* ------------------------------ */
/* HEADER */
/* ------------------------------ */
.menu-header {
  padding: 0.5rem 1rem 0.5rem;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border-subtle);
}

.menu-header h2 {
  margin-top: 0px !important;
  font-family: var(--font-head);
  font-size: 1.25rem;
}

.contact-link {
  background: none;
  border: none;
  margin-top: 0.2rem;
  color: var(--color-link);
  text-decoration: none;
  cursor: pointer;
}
.contact-link:hover {
  color: var(--color-link-hover);
}

/* ------------------------------ */
/* STICKY FILTER + SEARCH */
/* ------------------------------ */
.menu-header-sticky {
  position: sticky;
  top: 0;
  background: var(--color-bg);
  padding-bottom: 0.2rem;
  border-bottom: 1px solid var(--color-border-subtle);
  z-index: 22;
  padding-right:1rem
}

.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem 0.4rem;
}

.mode-toggle button {
  flex: 1;
  padding: 0.45rem 0.2rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-muted);
  cursor: pointer;
}
.mode-toggle button.selected {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.search-box {
  padding: 0.5rem 1rem;
}
.search-box input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
}

/* ------------------------------ */
/* LIST */
/* ------------------------------ */
.menu-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
}

.group {
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.group h4 {
  margin: 0.4rem 0;
  padding: 0.2rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

/* ✔️ HOVER FIX */
.menu-list li:hover {
  background: var(--color-primary-soft);
  color: var(--color-text);
  transition: background 0.15s ease, color 0.15s ease;
}

.artist-row:hover {
  background: var(--color-primary-soft);
  transition: background 0.15s ease;
}

/* Single item */
.menu-list li {
  padding: 0.45rem 0.7rem;
  border-radius: var(--radius-sm);
}
.menu-list li.selected {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

/* Artist row */
.artist-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0.7rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.artist-arrow {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* ------------------------------ */
/* RANDOM BUTTON (BOTTOM) */
/* ------------------------------ */
.random-btn-sticky {
  position: sticky;
  bottom: 0;
  
  text-align: center;
  padding: 0rem 0 1.5rem 0.5rem;
  z-index: 24;
}

.random-btn {
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-muted);
  cursor: pointer;
}
.random-btn:hover {
  background: var(--color-primary-soft);
  transform: scale(1.05);
}

/* Verberg tagline op mobiele schermen */
@media (max-width: 640px) {
  .tagline {
    display: none;
  }
}
</style>
