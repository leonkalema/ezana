<script lang="ts">
  import RegisterForm from '$lib/components/auth/register-form.svelte';
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
  <title>Sign Up - Binojo</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF9] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <RegisterForm />
  </div>
</div>
