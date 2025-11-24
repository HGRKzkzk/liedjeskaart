<script>
  export let text = 'Bezig met laden…';
</script>

<div class="loading">
  <div class="spinner"></div>
  <p>{text}</p>
</div>

<style>
.loading {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: center;
  justify-content: center;

  /* THEME-AWARE: gebruikt jouw projectvariabelen */
  color: var(--color-text);
  background: var(--color-bg-muted);

  font-size: 1rem;
  z-index: 40;
}

/* spinner cirkel */
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;

  /* THEME-AWARE borderkleuren */
  border: 3px solid var(--color-border-subtle);
  border-top-color: var(--color-text-muted);

  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
