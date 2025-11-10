<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { createEventDispatcher } from 'svelte';
  import type { Marker } from '$lib/types';

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

  // --- Filteren ---
  $: filteredMarkers =
    listMode === 'plaats'
      ? markers.filter((m) =>
          (m.place || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : markers.filter((m) =>
          (m.artist || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

  // --- Plaatsen groeperen ---
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

  // --- Artiesten groeperen per letter ---
  $: artistLetterGroups = (() => {
    if (listMode !== 'artiest') return {};
    const byArtist: Record<string, Marker[]> = {};
    for (const m of filteredMarkers) {
      const artist = m.artist || 'Onbekend';
      (byArtist[artist] ??= []).push(m);
    }
    const groups: Record<string, [string, Marker[]][]> = {};
    for (const [artist, list] of Object.entries(byArtist)) {
      const letter = (artist[0] || '?').toUpperCase();
      (groups[letter] ??= []).push([artist, list]);
    }
    for (const letter in groups) groups[letter].sort(([a], [b]) => a.localeCompare(b));
    return groups;
  })();
</script>

{#if menuOpen}
  <!-- Overlay -->
  <div
    class="menu-overlay"
    in:fade={{ duration: 250 }}
    out:fade={{ duration: 200 }}
    on:click={closeMenu}
  ></div>

  <!-- Sidebar -->
  <aside
    class="side-menu"
    in:slide={{ duration: 250, easing: cubicOut }}
    out:slide={{ duration: 200, easing: cubicOut }}
  >
    <!-- Topbar -->
    <div class="menu-topbar">
      <button class="menu-close" on:click={closeMenu}>×</button>
    </div>

    <!-- Header -->
    <div class="menu-header">
      <h2>Liedjeskaart van Nederland</h2>
      <p>
        Vragen, toevoegingen of suggesties?
        <a href="mailto:wouter.van.itterzon@gmail.com">wouter.van.itterzon@gmail.com</a>
      </p>
    </div>

    <!-- Sticky sectie -->
    <div class="menu-header-sticky">
      <div class="mode-toggle">
        <button
          class:selected={listMode === 'plaats'}
          on:click={() => setListMode('plaats')}
        >
          Plaatsen
        </button>
        <button
          class:selected={listMode === 'artiest'}
          on:click={() => setListMode('artiest')}
        >
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

    <!-- Lijst -->
    <div class="menu-list" transition:fade>
      {#if filteredMarkers.length === 0}
        <p class="no-results">Geen resultaten gevonden</p>

      {:else if listMode === 'plaats'}
        {#each Object.entries(groupedMarkers) as [letter, list]}
          <div class="group">
            <h4>{letter}</h4>
            <ul>
              {#each list as m}
                <li
                  on:click={() => openPlace(m)}
                  class:selected={selectedPlace === m}
                >
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
                    <span class="artist-name">{artist}</span>
                    {#if list.length > 1}
                      <span class="artist-arrow">
                        {openArtists.has(artist) ? '▾' : '▸'}
                      </span>
                    {/if}
                  </div>

                  {#if openArtists.has(artist)}
                    <ul
                      in:slide={{ duration: 200, easing: cubicOut }}
                      out:slide={{ duration: 150, easing: cubicOut }}
                    >
                      {#each list as m}
                        <li
                          on:click={() => openPlace(m)}
                          class:selected={selectedPlace === m}
                        >
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
  </aside>
{/if}

<style>
  .menu-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: var(--blur-overlay);
    z-index: 14;
  }

  .side-menu {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 480px;
    max-width: 100%;
    background: var(--color-bg-muted);
    box-shadow: 3px 0 20px var(--color-shadow);
    border-right: 2px solid var(--color-border-subtle);
    z-index: 15;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    font-family: var(--font-body);
  }

  .menu-topbar {
    position: sticky;
    top: 0;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border-subtle);
    z-index: 25;
    display: flex;
    justify-content: flex-end;
  }

  .menu-close {
    font-size: 1.6rem;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0.5rem 0.7rem;
    transition: transform var(--transition-fast), color var(--transition-fast);
  }
  .menu-close:hover {
    color: var(--color-text);
    transform: scale(1.1);
  }

  .menu-header {
    padding: 1.2rem 1rem 0.6rem;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .menu-header h2 {
    margin: 0 0 0.4rem;
    font-family: var(--font-head);
    font-size: 1.25rem;
    color: var(--color-text);
  }
  .menu-header p {
    margin: 0.1rem 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
  .menu-header a {
    color: var(--color-link);
  }
  .menu-header a:hover {
    color: var(--color-link-hover);
  }

  .menu-header-sticky {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border-subtle);
    box-shadow: 0 2px 6px rgba(47, 47, 47, 0.08);
  }

  .mode-toggle {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem 0.4rem;
  }
  .mode-toggle button {
    flex: 1;
    padding: 0.45rem 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-subtle);
    background: var(--color-bg-muted);
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition-medium), color var(--transition-medium), border-color var(--transition-medium);
  }
  .mode-toggle button:hover {
    background: var(--color-primary-soft);
  }
  .mode-toggle button.selected {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .mode-toggle {
      gap: 0.3rem;
      padding: 0.4rem 0.6rem 0.3rem;
    }
    .mode-toggle button {
      padding: 0.35rem 0.3rem;
      font-size: 0.8rem;
      border-radius: 6px;
    }
  }

  .search-box {
    padding: 0.5rem 1rem 0.8rem;
  }
  .search-box input {
    width: 100%;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    font-size: 0.95rem;
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .menu-list {
    flex: 1;
    padding: 0 1rem 1.5rem;
    margin-top: 0.5rem;
  }

  .group {
    margin-bottom: 1.4rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .group h4 {
    position: sticky;
    top: 130px;
    margin: 0.4rem 0 0.35rem;
    padding: 0.2rem 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    background: var(--color-bg-muted);
  }

  .menu-list li {
    padding: 0.45rem 0.5rem 0.45rem 0.7rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .menu-list li:hover {
    background: var(--color-primary-soft);
  }
  .menu-list li.selected {
    background: var(--color-primary);
    color: #fff;
    font-weight: 600;
  }

  .artist-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.45rem 0.7rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .artist-row:hover {
    background: var(--color-primary-soft);
  }
  .artist-name {
    color: var(--color-text);
    font-weight: 400;
  }
  .artist-arrow {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    width: 1rem;
    text-align: center;
  }

  .no-results {
    padding: 0.8rem 0.4rem;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
