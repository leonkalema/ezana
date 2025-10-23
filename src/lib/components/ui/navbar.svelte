<script lang="ts">
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import WalletBalance from '$lib/components/ui/wallet-balance.svelte';
  import WalletModal from '$lib/components/ui/wallet-modal.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  $: ({ user, isAuthenticated } = $authStore);
  $: ({ currentGame } = $gameStore);
  
  let showUserMenu = false;
  let showWalletModal = false;
  
  async function handleLogout() {
    await authStore.logout();
    gameStore.reset();
    goto('/');
    showUserMenu = false;
  }
  
  function closeUserMenu() {
    showUserMenu = false;
  }
  
  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }
</script>

<nav class="bg-white shadow-lg border-b border-[#E9E8E3]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and Navigation -->
      <div class="flex items-center">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-10 h-10 bg-[#6B8E7E] rounded-lg flex items-center justify-center shadow-md">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-bold text-[#2D2D2D]">Binojo</span>
            <span class="text-xs text-[#6B8E7E] font-medium -mt-1">Play. Win. Get Rich.</span>
          </div>
        </a>
        
        {#if isAuthenticated}
          <div class="hidden md:flex ml-10 space-x-8">
            <a 
              href="/dashboard" 
              class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                $page.url.pathname === '/dashboard' 
                  ? 'bg-[#E9E8E3] text-[#6B8E7E]' 
                  : 'text-[#2D2D2D] hover:text-[#6B8E7E] hover:bg-[#E9E8E3]'
              }`}
            >
              Dashboard
            </a>
            
            {#if currentGame}
              <a 
                href="/game/{currentGame.game_code}" 
                class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  $page.url.pathname.startsWith('/game/') 
                    ? 'bg-[#E9E8E3] text-[#6B8E7E]' 
                    : 'text-[#2D2D2D] hover:text-[#6B8E7E] hover:bg-[#E9E8E3]'
                }`}
              >
                Current Game
              </a>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- User Menu -->
      <div class="flex items-center space-x-4">
        {#if isAuthenticated && user}
          <!-- Wallet Balance -->
          <WalletBalance on:openWallet={() => showWalletModal = true} />
          <div class="relative">
            <button
              on:click={toggleUserMenu}
              class="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[#2D2D2D] hover:text-[#6B8E7E] hover:bg-[#E9E8E3] transition-colors"
            >
              <div class="w-8 h-8 bg-[#6B8E7E] rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span class="hidden sm:block">{user.username}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {#if showUserMenu}
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                <div class="px-4 py-2 text-sm text-gray-700 border-b">
                  <p class="font-medium">{user.username}</p>
                  <p class="text-gray-500">{user.email}</p>
                </div>
                
                <a 
                  href="/dashboard" 
                  on:click={closeUserMenu}
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </a>
                
                <button
                  on:click={handleLogout}
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="flex items-center space-x-4">
            <a 
              href="/login" 
              class="text-[#2D2D2D] hover:text-[#6B8E7E] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </a>
            <a 
              href="/register" 
              class="bg-[#6B8E7E] hover:bg-[#5a7569] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-md"
            >
              Sign Up
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>

<!-- Click outside to close user menu -->
{#if showUserMenu}
  <div 
    class="fixed inset-0 z-40" 
    on:click={closeUserMenu}
    role="button"
    tabindex="-1"
    on:keydown={(e) => e.key === 'Escape' && closeUserMenu()}
  ></div>
{/if}

<!-- Wallet Modal -->
<WalletModal bind:isVisible={showWalletModal} on:close={() => showWalletModal = false} />
