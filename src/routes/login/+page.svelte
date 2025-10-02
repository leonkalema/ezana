<script lang="ts">
  import LoginForm from '$lib/components/auth/login-form.svelte';
  import { authStore } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  $: ({ isAuthenticated } = $authStore);
  
  onMount(() => {
    if (isAuthenticated) {
      goto('/dashboard');
    }
  });
</script>

<svelte:head>
  <title>Sign In - Binojo</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <LoginForm />
  </div>
</div>
