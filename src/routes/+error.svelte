<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  $: status = $page.status;
  $: message = $page.error?.message || 'An error occurred';
  
  const goHome = () => goto('/');
  const goBack = () => window.history.back();
</script>

<div class="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center border-2 border-[#E9E8E3]">
    <div class="mb-6">
      {#if status === 404}
        <div class="text-8xl mb-4">🔍</div>
        <h1 class="text-6xl font-bold text-[#2D2D2D] mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-[#2D2D2D] mb-2">Page Not Found</h2>
        <p class="text-[#2D2D2D] opacity-70">
          The page you're looking for doesn't exist or has been moved.
        </p>
      {:else if status === 500}
        <div class="text-8xl mb-4">⚠️</div>
        <h1 class="text-6xl font-bold text-[#2D2D2D] mb-4">500</h1>
        <h2 class="text-2xl font-semibold text-[#2D2D2D] mb-2">Server Error</h2>
        <p class="text-[#2D2D2D] opacity-70">
          Something went wrong on our end. Please try again later.
        </p>
      {:else}
        <div class="text-8xl mb-4">❌</div>
        <h1 class="text-6xl font-bold text-[#2D2D2D] mb-4">{status}</h1>
        <h2 class="text-2xl font-semibold text-[#2D2D2D] mb-2">Error</h2>
        <p class="text-[#2D2D2D] opacity-70">{message}</p>
      {/if}
    </div>
    
    <div class="flex flex-col sm:flex-row gap-4 mt-8">
      <button
        on:click={goBack}
        class="flex-1 px-6 py-3 border-2 border-[#6B8E7E] text-[#6B8E7E] rounded-xl hover:bg-[#E9E8E3] font-semibold transition-all"
      >
        Go Back
      </button>
      <button
        on:click={goHome}
        class="flex-1 px-6 py-3 bg-[#6B8E7E] text-white rounded-xl hover:bg-[#5a7569] font-semibold transition-all"
      >
        Go Home
      </button>
    </div>
    
    {#if status === 404}
      <p class="text-sm text-[#2D2D2D] opacity-60 mt-6">
        Lost? Head back to the <a href="/dashboard" class="text-[#6B8E7E] hover:underline font-medium">dashboard</a>
      </p>
    {/if}
  </div>
</div>
