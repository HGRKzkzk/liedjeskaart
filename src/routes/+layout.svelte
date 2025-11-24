<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import "../app.css";
  import { onMount } from "svelte";

  onMount(() => {

  });

  afterNavigate(() => {
  const v = document.querySelector('meta[name="app-version"]')?.content;
  if (v) {
    sessionStorage.setItem('app-version', v);
  }
});

</script>

<slot />
