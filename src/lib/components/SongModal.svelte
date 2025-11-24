<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { Marker } from '$lib/types';
  import { browser } from '$app/environment';

  export let selectedPlace: Marker;

  const dispatch = createEventDispatcher();

  let modalEl: HTMLDivElement;
  let closeButton: HTMLButtonElement;
  let touchStartX: number | null = null;
  let touchStartY: number | null = null;
  let videoLoaded = false;
  let lastYoutubeId: string | null = null;

  // Alleen resetten als er écht een nieuwe video is
  $: if (selectedPlace && selectedPlace.youtubeId !== lastYoutubeId) {
    videoLoaded = false;
    lastYoutubeId = selectedPlace.youtubeId;
  }

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

  // Veilige share-knop
  function sharePlace(place: Marker) {
    if (!browser || !place) return;

    const url = window.location.href;
    const title = `🎵 ${place.artist} — ${place.song}`;
    const text = `Ik vond een leuk liedje over ${place.place} voor je op de liedjeskaart van Nederland!`;

    if (navigator.share) {
      navigator
        .share({ title, text, url })
        .catch((err) => console.warn('Delen geannuleerd of mislukt', err));
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('📋 Link gekopieerd!');
    }
  }

  // helper om knoppen alleen in browser te tonen
  function showIfBrowser(node: HTMLElement) {
    if (!browser) node.style.display = 'none';
  }

  onMount(() => {
    if (closeButton) closeButton.focus();
  });
</script>

<!-- Backdrop -->
<div
  class="overlay-backdrop"
  transition:fade
  on:click={() => dispatch('close')}
></div>

<!-- Modal -->
<div
  class="song-modal"
  bind:this={modalEl}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  transition:scale={{ duration: 250, easing: cubicOut }}
>
  <button
    class="close"
    bind:this={closeButton}
    on:click={() => dispatch('close')}
    aria-label="Sluiten"
  >
    ×
  </button>

  <!-- Scrollbare inhoud -->
  <div class="modal-content">
    <!-- Plaatsnaam bovenaan -->
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

    <!-- Lazy YouTube video -->
    {#if selectedPlace.youtubeId}
      <div class="video-wrapper" on:click={() => (videoLoaded = true)}>
        {#if !videoLoaded}
          <img
            src={`https://img.youtube.com/vi/${selectedPlace.youtubeId}/hqdefault.jpg`}
            alt="Klik om video te laden"
            class="video-thumb"
          />
          <div class="video-overlay">▶️</div>
        {:else}
          <iframe
            src={`https://www.youtube.com/embed/${selectedPlace.youtubeId}?autoplay=${videoLoaded ? 1 : 0}`}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {/if}
      </div>
    {/if}

    <!-- Meta-informatie -->
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
    </div>
  </div>
<br>
  <!-- Sticky footer met navigatie -->
  <div class="modal-footer">
    <button class="nav-btn" on:click={() => dispatch('prev')}>← Vorige</button>

    {#if selectedPlace}
      <button
        class="share-button"
        on:click={() => sharePlace(selectedPlace)}
        aria-label="Deel dit liedje"
        use:showIfBrowser
      >
        📤 Delen
      </button>
    {/if}

    <button class="nav-btn" on:click={() => dispatch('next')}>Volgende →</button>
  </div>
</div>

<style>
  @import '$lib/styles/variables.css';

  /* Achtergrond */
  .overlay-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: var(--blur-overlay);
    z-index: 30;
  }

  /* Hoofdmodal: vaste hoogte + flex + sticky footer */
  .song-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-bg);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    width: min(90%, 600px);
    z-index: 31;
    display: flex;
    flex-direction: column;
    max-height:110vh;
    overflow: hidden;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem 0.75rem;

    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary-soft) var(--color-bg-muted);
  }

  .modal-content::-webkit-scrollbar {
    width: 8px;
  }
  .modal-content::-webkit-scrollbar-thumb {
    background-color: var(--color-primary-soft);
    border-radius: 6px;
  }
  .modal-content::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-accent-warm);
  }
  .modal-content::-webkit-scrollbar-track {
    background: var(--color-bg-muted);
  }

  .modal-footer {
    padding: 0.75rem 1.25rem 1rem;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  /* Plaatsnaam */
  .place-label-wrapper {
    text-align: center;
    margin: 0.2rem auto 0.6rem;
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

  /* Titel */
  h3 {
    font-family: var(--font-head);
    margin: 0.3rem 0 0.6rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    text-align: left;
  }

  /* Video */
  .video-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    background: #000;
    border-radius: var(--radius-md);
    overflow: hidden;
    flex-shrink: 0;
    margin-top: 0.4rem;
    margin-bottom: 0.9rem;
    cursor: pointer;
  }

  .video-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    inset: 0;
  }

  .video-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #fff;
    background: rgba(0, 0, 0, 0.35);
    border-radius: var(--radius-md);
    pointer-events: none;
    transition: background 0.25s ease;
  }

  .video-wrapper:hover .video-overlay {
    background: rgba(0, 0, 0, 0.5);
  }

  .video-wrapper iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  /* Sluitknop */
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

  /* Meta */
  .song-meta {
    margin-top: 0.4rem;
    margin-bottom: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.92rem;
    color: var(--color-text-muted);
  }

  .meta-duo {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 1.4rem;
    margin-top: 0.4rem;
    flex-wrap: wrap;
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

  /* Links */
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
    text-decoration: underline;
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

  /* Footer knoppen */
  .nav-btn,
  .share-button {
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
    white-space: nowrap;
  }

  .nav-btn {
    background: var(--color-primary-soft);
    color: var(--color-text);
    font-weight: 500;
  }

  .nav-btn:hover {
    background: var(--color-primary);
    color: #fff;
    transform: scale(1.03);
  }

  .share-button {
    background: var(--color-bg-muted);
    color: var(--color-primary);
    font-weight: 500;
  }

  .share-button:hover {
    background: var(--color-primary-soft);
    color: var(--color-text);
    transform: scale(1.03);
  }

  p {
    margin-top: 0.75rem;
    line-height: 1.6;
    font-size: 0.95rem;
    color: var(--color-text);
  }

  /* Mobiel */
  @media (max-width: 480px) {
    .song-modal {
      width: 94%;
      height: 85vh;
    }

    .close {
      top: 2px;
      right: 10px;
      font-size: 1.8rem;
    }

    h3 {
      font-size: 0.95rem;
    }

    .nav-btn,
    .share-button {
      font-size: 0.85rem;
      padding: 0.45rem 0.75rem;
    }
  }
</style>
