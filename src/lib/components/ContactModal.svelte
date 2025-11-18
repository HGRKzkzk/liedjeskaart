<script lang="ts">
  import { scale } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { introHtmlBase, extraHtmlBase } from '../data/content';
  export let count = 0;

  let introHtml = '';
  let extraHtml = '';

  // ✔️ Reactief: wordt opnieuw uitgevoerd als count verandert
  $: introHtml = introHtmlBase.replace('{COUNT}', String(count));
  $: extraHtml = extraHtmlBase.replace('{COUNT}', String(count));
  

  const dispatch = createEventDispatcher();
  export let open = false;

  // Modal state
  let introDone = false;
  let extraInfo = false;

  let scrollEl: HTMLElement | null = null;
  let scrolledToBottom = false;

  function resetState() {
    introDone = false;
    extraInfo = false;
    scrolledToBottom = false;
  }

  function resetScroll() {
    if (scrollEl) {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function close() {
    dispatch('close');
    resetState();
    resetScroll();
  }

  function goBack() {
    resetState();
    resetScroll();
  }

  // Scroll tracker voor fade-in van de “Ik ga op reis!” knop
  function handleScroll() {
    if (!scrollEl) return;
    const threshold = scrollEl.scrollHeight - scrollEl.clientHeight - 10;
    scrolledToBottom = scrollEl.scrollTop >= threshold;
  }

  // Handle clicks in intro HTML (voor de 'hier' link)
  function handleIntroClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.dataset.action === 'open-contact') {
      e.preventDefault();
      introDone = true;
      resetScroll();
    }
  }
</script>

{#if open}
<div class="overlay">
  <div class="modal" in:scale={{ duration: 200 }} out:scale={{ duration: 150 }}>

    <!-- STICKY HEADER -->
    <div class="modal-header">
      <h3>
        {#if extraInfo}
          Verantwoording, dankwoord, etc.
        {:else if introDone}
          Contact
        {:else}
          Liedjeskaart van Nederland
        {/if}
      </h3>

      <button class="close" on:click={close} aria-label="Sluiten">×</button>
    </div>

    <!-- SCROLLBARE CONTENT -->
    <div class="modal-content scroll-area"
         bind:this={scrollEl}
         on:scroll={handleScroll}>

      {#if !introDone && !extraInfo}
        <!-- INTRO -->
        <div class="intro" on:click={handleIntroClick}>
ssfkjhfskjh

          {@html introHtml}
        </div>

      {:else if extraInfo}
        <!-- EXTRA INFO -->
        <div class="extra-info">
          {@html extraHtml}


        </div>
      {/if}
    </div>

    <!-- STICKY FOOTER -->
    <div class="modal-footer">
      {#if !introDone && !extraInfo}
        <button class="secondary-btn" on:click={() => { extraInfo = true; resetScroll(); }}>
          Nog meer informatie
        </button>

        <button class="primary-btn go-btn {scrolledToBottom ? 'active' : ''}"
                on:click={close}
                disabled={!scrolledToBottom}>
          Ik weet genoeg, ik ga op reis!
        </button>

      {:else if extraInfo}
        <button class="secondary-btn" on:click={() => { goBack(); resetScroll(); }}>
          ← Terug
        </button>

      {:else}
        <button class="primary-btn" on:click={close}>
          Sluiten
        </button>
      {/if}
    </div>

  </div>
</div>
{/if}

<style>
  @import '$lib/styles/ModalBase.css';

  /* HEADER */
  .modal-header {
    position: sticky;
    top: 0;
    background: var(--color-bg);
    z-index: 3;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-header h3 {
    flex: 1;
    text-align: center;
    margin: 0;
  }

  .modal-header .close {
    position: absolute;
    right: 14px;
    top: 5px;
  }

  /* Scroll area */
  .scroll-area {
      
    overflow-y: auto;
    max-height: calc(90vh - 120px);
    padding: 1.3rem 1.5rem;
  }

  .intro,
  .extra-info {
    line-height: 1.55;
    font-size: 0.95rem;
  }

  /* FOTO'S */
   .content-img,
  .parents-pic,
  .cat-pic {
    width: 100%;
    max-width: 260px;
    display: block;
    margin: 1.2rem auto 0.7rem auto;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }

  .caption {
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 1.2rem;
  }

  /* CONTACT EMAIL */
  .contact-email {
    text-align: center;
    font-size: 1rem;
    margin-top: 1rem;
  }

  .contact-email .mail a {
    font-size: 1.1rem;
    color: var(--color-primary);
    font-weight: 600;
  }

  /* BUTTONS */
  .primary-btn,
  .secondary-btn {
    padding: 0.65rem 1.2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.25s ease, transform 0.15s ease, opacity 0.25s ease;
    user-select: none;
  }

  .primary-btn {
    background: var(--color-primary);
    color: white;
    border: none;
  }

  .primary-btn:hover {
    transform: scale(1.03);
  }

  /* “Ik ga op reis!” fade indicator */
  .go-btn:not(.active) {
    background: var(--color-border-subtle);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .go-btn.active {
    background: var(--color-primary);
    color: white;
    cursor: pointer;
    opacity: 1;
  }

  .modal-footer {
    position: sticky;
    bottom: 0;
    z-index: 3;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
  }


  /* --- MOBILE BOOST: maak modal veel hoger, betere scrollruimte --- */
@media (max-width: 480px) {
  .modal {
    width: 94%;
    max-height: 94vh !important;
    height: 94vh !important;
    margin: 0 auto;
  }

  .scroll-area {
    max-height: calc(94vh - 140px) !important; /* header (~60) + footer (~80) */
    padding: 1rem 1.2rem;
  }

  .modal-header {
    padding: 0.7rem 1rem;
  }

  .modal-footer {
    padding: 0.7rem 1rem;
    gap: 0.6rem;
  }

  .primary-btn,
  .secondary-btn {
    padding: 0.55rem 0.9rem;
    font-size: 0.85rem;
  }
}

/* --- iOS Safari FIX: correct gebruik van dynamic viewport units --- */
@supports (-webkit-touch-callout: none) {
  @media (max-width: 480px) {
    .modal {
      max-height: 94dvh !important;
      height: 94dvh !important;
    }
    .scroll-area {
      max-height: calc(94dvh - 140px) !important;
    }
  }
}


</style>
