<script lang="ts">
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

<div class="min-h-screen bg-[#FAFAF9]">
  <div class="container mx-auto px-4 py-16">
    <!-- Hero Section -->
    <div class="text-center mb-16">
      <div class="flex justify-center mb-8">
        <div class="w-24 h-24 bg-gradient-to-br from-red-500 to-gray-800 rounded-2xl flex items-center justify-center shadow-2xl">
          <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      
      <h1 class="text-5xl md:text-7xl font-bold text-[#2D2D2D] mb-6">
        Welcome to <span class="text-[#6B8E7E]">Binojo</span>
      </h1>
      
      <p class="text-xl md:text-2xl text-[#2D2D2D]/70 mb-8 max-w-3xl mx-auto">
        The ultimate peer-to-peer checkers experience. Play with friends in real-time, 
        create private games, or find opponents through matchmaking.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/register" 
          class="bg-[#6B8E7E] hover:bg-[#5a7569] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
        >
          Get Started
        </a>
        <a 
          href="/login" 
          class="bg-white hover:bg-[#E9E8E3] text-[#2D2D2D] px-8 py-4 rounded-lg text-lg font-semibold border-2 border-[#E9E8E3] transition-colors shadow-lg hover:shadow-xl"
        >
          Sign In
        </a>
      </div>
    </div>
    
    <!-- Features Section -->
    <div class="grid md:grid-cols-3 gap-8 mb-16">
      <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
        <div class="w-12 h-12 bg-[#E9E8E3] rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-[#6B8E7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-[#2D2D2D] mb-3">Real-time Gameplay</h3>
        <p class="text-[#2D2D2D]/70">
          Experience seamless real-time checkers with instant moves and live chat. 
          No delays, no lag - just pure gaming fun.
        </p>
      </div>
      
      <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
        <div class="w-12 h-12 bg-[#E9E8E3] rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-[#6B8E7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-[#2D2D2D] mb-3">Private Games</h3>
        <p class="text-[#2D2D2D]/70">
          Create private game rooms with custom codes. Share the link with friends 
          and enjoy exclusive matches with complete privacy.
        </p>
      </div>
      
      <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
        <div class="w-12 h-12 bg-[#E9E8E3] rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-[#6B8E7E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-[#2D2D2D] mb-3">Smart Matchmaking</h3>
        <p class="text-[#2D2D2D]/70">
          Can't find a friend to play? Use our intelligent matchmaking system 
          to find opponents and start playing instantly.
        </p>
      </div>
    </div>
    
    <!-- How it Works Section -->
    <div class="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
      <h2 class="text-3xl md:text-4xl font-bold text-center text-[#2D2D2D] mb-12">
        How It Works
      </h2>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-[#6B8E7E] rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-white">1</span>
          </div>
          <h3 class="text-xl font-semibold text-[#2D2D2D] mb-3">Create Account</h3>
          <p class="text-[#2D2D2D]/70">
            Sign up with your email and choose a unique username. It's quick and easy!
          </p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-[#6B8E7E] rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-white">2</span>
          </div>
          <h3 class="text-xl font-semibold text-[#2D2D2D] mb-3">Start Playing</h3>
          <p class="text-[#2D2D2D]/70">
            Create a private game, join with a code, or use matchmaking to find opponents.
          </p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-[#6B8E7E] rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-white">3</span>
          </div>
          <h3 class="text-xl font-semibold text-[#2D2D2D] mb-3">Enjoy & Win</h3>
          <p class="text-[#2D2D2D]/70">
            Play classic checkers with modern features. Chat with opponents and have fun!
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
