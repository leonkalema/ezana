<script lang="ts">
  import { gameStore } from '$lib/stores/game.js';
  import { authStore } from '$lib/stores/auth.js';
  import { onMount } from 'svelte';
  
  let messageInput = '';
  let chatContainer: HTMLDivElement;
  
  $: ({ gameMessages } = $gameStore);
  $: ({ user } = $authStore);
  
  onMount(() => {
    scrollToBottom();
  });
  
  $: if (gameMessages.length > 0) {
    scrollToBottom();
  }
  
  function scrollToBottom() {
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 10);
    }
  }
  
  function sendMessage() {
    if (!messageInput.trim()) return;
    
    gameStore.sendMessage(messageInput.trim());
    messageInput = '';
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
</script>

<div class="flex flex-col h-96 bg-white rounded-lg shadow-md">
  <!-- Chat Header -->
  <div class="px-4 py-3 border-b border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900">Game Chat</h3>
  </div>
  
  <!-- Messages Container -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto p-4 space-y-3"
  >
    {#if gameMessages.length === 0}
      <div class="text-center text-gray-500 text-sm">
        <p>No messages yet. Say hello to your opponent!</p>
      </div>
    {:else}
      {#each gameMessages as message}
        <div class="flex flex-col space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-900">
              {message.sender.username}
            </span>
            <span class="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          </div>
          <div class={`max-w-xs p-2 rounded-lg text-sm ${
            message.sender.id === user?.id 
              ? 'bg-blue-500 text-white ml-auto' 
              : 'bg-gray-200 text-gray-900'
          }`}>
            <p class="break-words">{message.message}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
  
  <!-- Message Input -->
  <div class="p-4 border-t border-gray-200">
    <div class="flex space-x-2">
      <input
        type="text"
        bind:value={messageInput}
        on:keypress={handleKeyPress}
        placeholder="Type a message..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        maxlength="200"
      />
      <button
        on:click={sendMessage}
        disabled={!messageInput.trim()}
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
      >
        Send
      </button>
    </div>
    <p class="text-xs text-gray-500 mt-1">
      Press Enter to send • {messageInput.length}/200
    </p>
  </div>
</div>
