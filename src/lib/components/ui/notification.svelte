<script lang="ts">
  import { onMount } from 'svelte';
  
  export let message: string = '';
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let duration: number = 3000;
  export let show: boolean = false;
  
  let visible = false;
  let timeoutId: NodeJS.Timeout;
  
  $: if (show && message) {
    showNotification();
  }
  
  function showNotification() {
    visible = true;
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      hideNotification();
    }, duration);
  }
  
  function hideNotification() {
    visible = false;
    show = false;
  }
  
  function getTypeClasses(): string {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  }
  
  function getIcon(): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  }
</script>

{#if visible}
  <div 
    class="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out {visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}"
    role="alert"
  >
    <div class="flex items-center space-x-3 text-white px-4 py-3 rounded-lg shadow-lg border-l-4 {getTypeClasses()} min-w-[300px] max-w-md">
      <span class="text-xl">{getIcon()}</span>
      <div class="flex-1">
        <p class="font-medium">{message}</p>
      </div>
      <button 
        on:click={hideNotification}
        class="text-white hover:text-gray-200 transition-colors"
        aria-label="Close notification"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
{/if}
