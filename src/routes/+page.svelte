<script lang="ts">
  import Map from '$lib/Map.svelte';
  import { getMarkersFromApi } from '$lib/sheetClient';
  import { fade, scale } from 'svelte/transition';
  import { onMount, tick } from 'svelte';

  let markers: any[] = [];
  let selectedPlace: any = null;
  let resetSignal = 0;
  let loading = true;

  onMount(async () => {
    try {
      const data = await getMarkersFromApi();
      markers = data;
      console.log('✅ markers uit /api/sheet:', markers);
    } catch (err) {
      console.error('❌ Fout bij ophalen markers:', err);
    } finally {
      loading = false;
    }
  });

  async function handleSelect(event: CustomEvent) {
    console.log('📨 Select event ontvangen:', event);
    console.log('📦 Event detail inhoud:', event.detail);

    const place = event.detail;

    // Forceer reactiviteit
    selectedPlace = null;
    await tick();
    selectedPlace = place;
    await tick();

    console.log('✅ selectedPlace ingesteld:', selectedPlace);
  }

  function closeModal() {
    selectedPlace = null;
    resetSignal += 1;
  }
</script>

{#if loading}
  <div class="loading">Laden...</div>
{:else}
  <Map {markers} bind:resetSignal on:select={handleSelect} />
{/if}

{#if selectedPlace}
  <div class="overlay-backdrop" transition:fade on:click={closeModal}></div>

  <div class="song-modal" transition:scale={{ duration: 250 }}>
    <button class="close" on:click={closeModal}>×</button>
    <h3>{selectedPlace.artist} - {selectedPlace.song}</h3>

    {#if selectedPlace.youtubeId}
      <div class="video-wrapper">
        <iframe
          src={`https://www.youtube.com/embed/${selectedPlace.youtubeId}?autoplay=0`}
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
      </div>
    {/if}

    <p>{selectedPlace.description}</p>
  </div>
{/if}

<style>
  .loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    color: #333;
  }

  .overlay-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(3px);
    z-index: 10;
  }

  .song-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    padding: 2rem;
    width: min(90%, 600px);
    z-index: 11;
    
  }

  .video-wrapper {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    border-radius: 10px;
    margin-bottom: 1rem;
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
    top: 10px;
    right: 14px;
    font-size: 1.8rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
  }
</style>
