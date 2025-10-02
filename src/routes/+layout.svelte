<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/ui/navbar.svelte';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.js';

	let { children } = $props();

	onMount(() => {
		// Validate authentication on app load
		authStore.validateAuth();
	});
</script>

<svelte:head>
	<title>Binojo - Peer-to-Peer Checkers</title>
	<meta name="description" content="Play checkers online with friends in real-time" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navbar />
	<main class="flex-1">
		{@render children?.()}
	</main>
</div>
