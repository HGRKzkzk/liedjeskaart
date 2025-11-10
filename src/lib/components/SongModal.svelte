<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { Marker } from '$lib/types';

  export let selectedPlace: Marker;

  const dispatch = createEventDispatcher();

  let modalEl: HTMLDivElement;
  let closeButton: HTMLButtonElement;
  let touchStartX: number | null = null;
  let touchStartY: number | null = null;

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      dispatch(diffX > 0 ? 'prev' : 'next');
    }
    touchStartX = touchStartY = null;
  }

  onMount(() => {
    if (closeButton) closeButton.focus();
  });
</script>

<!-- Backdrop -->
<div class="overlay-backdrop" transition:fade on:click={() => dispatch('close')}></div>

<!-- Modal -->
<div
  class="song-modal"
  bind:this={modalEl}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  transition:scale={{ duration: 250, easing: cubicOut }}
>
  <button class="close" bind:this={closeButton} on:click={() => dispatch('close')}>
    ×
  </button>

  <!-- 📍 Plaatsnaam -->
  {#if selectedPlace.wikiUrl}
    <div class="place-label-wrapper">
      <a
        class="place-label"
        href={selectedPlace.wikiUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        📍{selectedPlace.place}
        <svg
          class="link-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  {:else}
    <div class="place-label-wrapper">{selectedPlace.place}</div>
  {/if}

  <br><br>

  <!-- Titel -->
  <h3>
    {#if selectedPlace.artistUrl}
      <a
        class="artist-link"
        href={selectedPlace.artistUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {selectedPlace.artist}
        <svg
          class="link-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    {:else}
      {selectedPlace.artist}
    {/if}
    {" - "}{selectedPlace.song}
  </h3>

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

  <!-- Extra informatie -->
  <div class="song-meta">

    {#if selectedPlace.componist || selectedPlace.tekstschrijver}
      <div class="meta-duo">
        {#if selectedPlace.componist}
          <div class="meta-line">
            <span class="meta-icon">🎵</span>
            {#if selectedPlace.componistUrl}
              <a
                class="artist-link"
                href={selectedPlace.componistUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedPlace.componist}
                <svg
                  class="link-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            {:else}
              {selectedPlace.componist}
            {/if}
          </div>
        {/if}

        {#if selectedPlace.tekstschrijver}
          <div class="meta-line">
            <span class="meta-icon">🗒️</span>
            {#if selectedPlace.tekstschrijverUrl}
              <a
                class="artist-link"
                href={selectedPlace.tekstschrijverUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedPlace.tekstschrijver}
                <svg
                  class="link-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            {:else}
              {selectedPlace.tekstschrijver}
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <br /><br />

    <!-- Navigatie -->
    <div class="nav-buttons">
      <button class="nav-btn" on:click={() => dispatch('prev')}>← Vorige</button>
      <button class="nav-btn" on:click={() => dispatch('next')}>Volgende →</button>
    </div>
  </div>
</div>

<style>
  @import '$lib/styles/variables.css';

  .overlay-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: var(--blur-overlay);
    z-index: 30;
  }

  .song-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-bg);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    padding: 1rem;
    width: min(90%, 600px);
    z-index: 31;
  }

  /* 📍 Plaatsnaam gecentreerd */
  .place-label-wrapper {
    text-align: center;
    margin: 0.2rem auto 0.8rem;
  }

  .place-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .place-label:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }

  h3 {
    font-family: var(--font-head);
    margin: 0.5rem 0 0.6rem;
    font-size: 1.0rem;
    font-weight: 600;
    color: var(--color-text);
    text-align: left;
  }

  .video-wrapper {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    border-radius: var(--radius-md);
    margin-top: 0.4rem;
    margin-bottom: 1rem;
    background: #000;
    width: 100%;
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
    transition: transform var(--transition-medium), color var(--transition-medium);
    z-index: 32;
  }

  .close:hover {
    color: var(--color-text);
    transform: scale(1.1);
  }

  .nav-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.6rem;
    gap: 0.8rem;
  }

  .nav-btn {
    background: var(--color-primary-soft);
    border: none;
    padding: 0.55rem 1rem;
    border-radius: var(--radius-pill);
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--color-text);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .nav-btn:hover {
    background: var(--color-primary);
    color: #fff;
  }

  .artist-link {
    color: var(--color-primary);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color var(--transition-fast);
  }

  .artist-link:hover {
    color: var(--color-primary);
    text-decoration: none;
  }

  .link-icon {
    width: 14px;
    height: 14px;
    stroke: #9ca3af;
    flex-shrink: 0;
    transition: stroke var(--transition-fast), transform var(--transition-fast);
  }

  .place-label:hover .link-icon,
  .artist-link:hover .link-icon {
    stroke: var(--color-primary);
    transform: translateY(-1px);
  }

  .song-meta {
    margin-top: 0.6rem;
    margin-bottom: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.92rem;
    color: var(--color-text-muted);
  }

  /* 🎵🗒️ naast elkaar */
  .meta-duo {
    display: flex;
    justify-content: left;
    align-items: flex-start;
    gap: 1.4rem;
    margin-top: 0.4rem;
      flex-wrap: wrap; /* ✅ zorgt voor automatisch afbreken naar volgende regel */
  }

  .meta-line {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .meta-icon {
    font-size: 0.95rem;
    opacity: 0.8;
    width: 1.2rem;
    text-align: center;
  }

  p {
    margin-top: 1rem;
    line-height: 1.6;
    font-size: 0.95rem;
    color: var(--color-text);
  }
</style>
