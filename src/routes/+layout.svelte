<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/ui/navbar.svelte';
	import NotificationContainer from '$lib/components/ui/notification-container.svelte';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.js';

	let { children } = $props();

	onMount(() => {
		// Validate authentication on app load
		authStore.validateAuth();
	});
</script>

<svelte:head>
	<title>Binojo - Play Checkers, Win Money, Get Rich</title>
	<meta name="description" content="Play checkers online with real stakes. Win money, compete with players worldwide, and get rich playing the game you love." />
</svelte:head>

<div class="min-h-screen bg-[#FAFAF9]">
	<Navbar />
	<main class="flex-1">
		{@render children?.()}
	</main>
	<NotificationContainer />
</div>
