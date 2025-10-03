<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { soundManager } from '$lib/utils/sound.js';
  
  export let isVisible: boolean = false;
  export let isWinner: boolean = false;
  export let playerRole: 'player1' | 'player2' | null = null;
  export let winnerColor: 'red' | 'black' | null = null;
  
  const dispatch = createEventDispatcher();
  
  // Winner messages and sprites
  const winnerMessages = [
    "🎉 Congratulations! You're the Champion! 🎉",
    "🏆 Victory is Yours! Amazing Game! 🏆",
    "⭐ Brilliant Strategy! You Won! ⭐",
    "🎊 Outstanding Performance! Winner! 🎊",
    "👑 You Rule the Board! Victory! 👑"
  ];
  
  // Encouraging messages for losers
  const loserMessages = [
    "🌟 Great effort! Every master was once a beginner!",
    "💪 You played well! Practice makes perfect!",
    "🎯 Close game! You're getting better every time!",
    "🚀 Don't give up! Champions are made through challenges!",
    "⚡ Amazing try! Your next victory is just around the corner!",
    "🌈 Every loss is a lesson! You're improving!",
    "🎮 Well played! Ready for another challenge?",
    "💎 Your skills are shining! Keep going!",
    "🔥 That was intense! You've got this next time!",
    "🌟 Fantastic game! Winners never quit!"
  ];
  
  // Animated sprites (using CSS animations and emojis)
  const celebrationSprites = ['🎉', '🎊', '✨', '🎆', '🏆', '👑', '⭐', '💫', '🌟'];
  const encouragementSprites = ['💪', '🌟', '⚡', '🚀', '💎', '🔥', '🌈', '✨'];
  
  $: currentMessage = isWinner 
    ? winnerMessages[Math.floor(Math.random() * winnerMessages.length)]
    : loserMessages[Math.floor(Math.random() * loserMessages.length)];
  
  $: sprites = isWinner ? celebrationSprites : encouragementSprites;
  
  function handlePlayAgain() {
    dispatch('playAgain');
  }
  
  function handleBackToDashboard() {
    dispatch('backToDashboard');
  }
  
  // Play sound when modal becomes visible
  $: if (isVisible) {
    if (isWinner) {
      soundManager.playGameEnd();
    } else {
      // Play a gentler sound for losers
      setTimeout(() => soundManager.playTurnNotification(), 500);
    }
  }
</script>

{#if isVisible}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fly={{ duration: 300, opacity: 0 }}
  >
    <!-- Modal -->
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center relative overflow-hidden"
      transition:scale={{ duration: 400, start: 0.8 }}
    >
      <!-- Animated Background Sprites -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        {#each sprites as sprite, i}
          <div 
            class="absolute text-2xl animate-bounce opacity-20"
            style="
              left: {Math.random() * 80 + 10}%; 
              top: {Math.random() * 80 + 10}%;
              animation-delay: {i * 0.2}s;
              animation-duration: {2 + Math.random() * 2}s;
            "
          >
            {sprite}
          </div>
        {/each}
      </div>
      
      <!-- Content -->
      <div class="relative z-10">
        <!-- Main Sprite -->
        <div class="text-8xl mb-4 animate-pulse">
          {#if isWinner}
            <div class="animate-bounce">🏆</div>
          {:else}
            <div class="animate-pulse">🌟</div>
          {/if}
        </div>
        
        <!-- Result Text -->
        <div class="mb-4">
          {#if isWinner}
            <h2 class="text-3xl font-bold text-green-600 mb-2 animate-pulse">
              YOU WON!
            </h2>
            <div class="flex justify-center items-center space-x-2 mb-2">
              <div class="w-6 h-6 rounded-full {playerRole === 'player1' ? 'bg-red-500' : 'bg-gray-800'}"></div>
              <span class="font-semibold text-lg">
                {playerRole === 'player1' ? 'Red' : 'Black'} Wins!
              </span>
            </div>
          {:else}
            <h2 class="text-2xl font-bold text-blue-600 mb-2">
              Game Over
            </h2>
            <div class="flex justify-center items-center space-x-2 mb-2">
              <div class="w-6 h-6 rounded-full {winnerColor === 'red' ? 'bg-red-500' : 'bg-gray-800'}"></div>
              <span class="font-semibold text-lg">
                {winnerColor === 'red' ? 'Red' : 'Black'} Wins
              </span>
            </div>
          {/if}
        </div>
        
        <!-- Message -->
        <p class="text-gray-700 text-lg mb-6 leading-relaxed">
          {currentMessage}
        </p>
        
        <!-- Animated Celebration/Encouragement -->
        {#if isWinner}
          <div class="flex justify-center space-x-2 mb-6">
            {#each [0, 1, 2, 3, 4] as i}
              <div 
                class="text-3xl animate-bounce"
                style="animation-delay: {i * 0.1}s"
              >
                🎉
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex justify-center space-x-2 mb-6">
            {#each [0, 1, 2] as i}
              <div 
                class="text-2xl animate-pulse"
                style="animation-delay: {i * 0.3}s"
              >
                💪
              </div>
            {/each}
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="flex flex-col space-y-3">
          <button
            on:click={handlePlayAgain}
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🎮 Play Again
          </button>
          
          <button
            on:click={handleBackToDashboard}
            class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            🏠 Back to Dashboard
          </button>
        </div>
        
        <!-- Additional Winner Effects -->
        {#if isWinner}
          <div class="absolute -top-2 -right-2 text-4xl animate-spin" style="animation-duration: 3s;">
            ⭐
          </div>
          <div class="absolute -top-2 -left-2 text-4xl animate-spin" style="animation-duration: 4s; animation-direction: reverse;">
            🌟
          </div>
          <div class="absolute -bottom-2 -right-2 text-3xl animate-bounce" style="animation-delay: 0.5s;">
            🎊
          </div>
          <div class="absolute -bottom-2 -left-2 text-3xl animate-bounce" style="animation-delay: 1s;">
            🎉
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
</style>
