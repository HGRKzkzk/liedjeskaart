<script>
  import { siteMeta } from '$lib/data/siteMeta';
  import PageContent from '$lib/PageContent.svelte';
</script>

<svelte:head>
  <title>{siteMeta.title}</title>

  <meta name="description" content={siteMeta.description} />
  <meta name="keywords" content={siteMeta.keywords} />
  <meta name="author" content={siteMeta.author} />
  <meta name="robots" content="index, follow" />

  <meta property="og:title" content={siteMeta.title} />
  <meta property="og:description" content={siteMeta.description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={siteMeta.url} />
  <meta property="og:image" content={siteMeta.image} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={siteMeta.title} />
  <meta name="twitter:description" content={siteMeta.description} />
  <meta name="twitter:image" content={siteMeta.image} />

  <meta name="theme-color" content="#ffffff" />
  <link rel="canonical" href={siteMeta.url} />
</svelte:head>

<PageContent />
