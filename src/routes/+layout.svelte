<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";

  onMount(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch(console.error);
    }
  });
</script>

<slot />
