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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
