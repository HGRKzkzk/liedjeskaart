<script lang="ts">
	import Map from '$lib/Map.svelte';
	import { fade, scale } from 'svelte/transition';
	import { tick } from 'svelte';

	let selectedPlace: any = null;
	let resetSignal = 0;

	const markers = [
		{
			place: 'Amsterdam',
			song: 'Aan de Amsterdamse grachten',
			artist: 'Wim Sonneveld',
			description: 'Een klassiek lied over de charme van de hoofdstad.',
			lon: 4.9,
			lat: 52.37,
			youtubeId: 'lFjYpAVyqXY'
		},
		{
			place: 'Den Bosch',
			song: 'Brabant',
			artist: 'Guus Meeuwis',
			description: 'Een ode aan de provincie van zachte G en gezelligheid.',
			lon: 5.3,
			lat: 51.7,
			youtubeId: '7duT7vRzQVE'
		},
		{
			place: 'Groningen',
			song: 'Het gras van het Noorderplantsoen',
			artist: 'Wia Buze',
			description: 'Een lied over het leven en de mensen in Groningen.',
			lon: 6.57,
			lat: 53.22,
			youtubeId: '0m8eMMPB9fs'
		}
	];

	// EVENT: ontvang hele marker via event.detail
	async function handleSelect(event: CustomEvent) {
		const place = event.detail;
		console.log('Geselecteerd:', place);
		selectedPlace = { ...place };
		await tick();
	}

	function closeModal() {
		selectedPlace = null;
		resetSignal += 1;
	}
</script>

<Map {markers} bind:resetSignal on:select={handleSelect} />

{#if selectedPlace}
	<div class="overlay-backdrop" transition:fade on:click={closeModal}></div>

	<div class="song-modal" transition:scale={{ duration: 250 }}>
		<button class="close" on:click={closeModal}>×</button>

		<h2>{selectedPlace.place}</h2>
		<h3>{selectedPlace.song} — {selectedPlace.artist}</h3>

		{#if selectedPlace.youtubeId}
			<div class="video-wrapper">
				<iframe
					src="https://www.youtube.com/embed/{selectedPlace.youtubeId}?autoplay=1"
					frameborder="0"
					allow="autoplay; encrypted-media"
					allowfullscreen
				></iframe>
			</div>
		{/if}

		<p>{selectedPlace.description}</p>

		<!-- DEBUG: zie alle data -->
		<!-- <pre>{JSON.stringify(selectedPlace, null, 2)}</pre> -->
	</div>
{/if}

<style>
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
		text-align: center;
		max-height: 90vh;
		overflow-y: auto;
	}

	.song-modal h2 {
		font-size: 1.6rem;
		color: #244b66;
		margin-bottom: 0.3rem;
	}

	.song-modal h3 {
		font-size: 1.1rem;
		color: #444;
		margin-bottom: 1rem;
		font-weight: 500;
	}

	.song-modal p {
		font-size: 0.95rem;
		line-height: 1.5;
		color: #444;
		margin-top: 1rem;
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
		line-height: 1;
	}

	.close:hover {
		color: #000;
	}
</style>