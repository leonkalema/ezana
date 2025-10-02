<script lang="ts">
  import { authStore } from '$lib/stores/auth.js';
  import { gameStore } from '$lib/stores/game.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  $: ({ user, isAuthenticated } = $authStore);
  $: ({ currentGame } = $gameStore);
  
  let showUserMenu = false;
  
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

<nav class="bg-white shadow-lg border-b">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and Navigation -->
      <div class="flex items-center">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-gray-800 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="text-xl font-bold text-gray-900">Binojo</span>
        </a>
        
        {#if isAuthenticated}
          <div class="hidden md:flex ml-10 space-x-8">
            <a 
              href="/dashboard" 
              class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                $page.url.pathname === '/dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </a>
            
            {#if currentGame}
              <a 
                href="/game/{currentGame.game_code}" 
                class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  $page.url.pathname.startsWith('/game/') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Current Game
              </a>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- User Menu -->
      <div class="flex items-center">
        {#if isAuthenticated && user}
          <div class="relative">
            <button
              on:click={toggleUserMenu}
              class="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </a>
            <a 
              href="/register" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
