<script lang="ts">
	import '../app.css';
	
	let { children } = $props();


	  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('✅ Service worker actief'))
      .catch((err) => console.error('❌ SW-fout:', err));
  }
</script>


{@render children()}
