<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { soundManager } from '$lib/utils/sound.js';
  
  export let value: number = 1;
  export let isRolling: boolean = false;
  export let canRoll: boolean = true;
  export let playerColor: 'red' | 'blue' | 'yellow' | 'green' | null = null;
  
  const dispatch = createEventDispatcher();
  
  let diceElement: HTMLDivElement;
  let rollAnimation: number;
  
  // Dice face dot patterns
  const diceFaces = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
    3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
    4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
    5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
    6: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }]
  };
  
  function rollDice() {
    if (!canRoll || isRolling) return;
    
    // Play roll sound
    soundManager.playMoveSuccess();
    
    // Start rolling animation
    isRolling = true;
    dispatch('rollStart');
    
    // Animate the dice rolling
    let rollCount = 0;
    const maxRolls = 15;
    const rollInterval = 100;
    
    rollAnimation = setInterval(() => {
      value = Math.floor(Math.random() * 6) + 1;
      rollCount++;
      
      if (rollCount >= maxRolls) {
        clearInterval(rollAnimation);
        
        // Final roll result
        setTimeout(() => {
          const finalValue = Math.floor(Math.random() * 6) + 1;
          value = finalValue;
          isRolling = false;
          
          // Play result sound based on value
          if (finalValue === 6) {
            soundManager.playCelebration();
          } else {
            soundManager.playTurnNotification();
          }
          
          dispatch('rollComplete', { value: finalValue });
        }, 200);
      }
    }, rollInterval);
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      rollDice();
    }
  }
  
  $: dots = diceFaces[value as keyof typeof diceFaces] || diceFaces[1];
  $: colorClass = playerColor ? `dice-${playerColor}` : 'dice-default';
</script>

<div class="dice-container">
  <div 
    class="dice {colorClass} {isRolling ? 'rolling' : ''} {canRoll ? 'can-roll' : 'disabled'}"
    class:shaking={isRolling}
    bind:this={diceElement}
    on:click={rollDice}
    on:keydown={handleKeydown}
    tabindex={canRoll ? 0 : -1}
    role="button"
    aria-label="Roll dice (current value: {value})"
  >
    <!-- Dice Face -->
    <div class="dice-face">
      {#each dots as dot}
        <div 
          class="dot" 
          style="left: {dot.x}%; top: {dot.y}%; transform: translate(-50%, -50%)"
        ></div>
      {/each}
    </div>
    
    <!-- Roll instruction -->
    {#if canRoll && !isRolling}
      <div class="roll-hint">
        <span>🎲 Click to Roll</span>
      </div>
    {/if}
    
    <!-- Rolling indicator -->
    {#if isRolling}
      <div class="rolling-indicator">
        <span>🎲 Rolling...</span>
      </div>
    {/if}
    
    <!-- Result highlight for 6 -->
    {#if !isRolling && value === 6}
      <div class="six-highlight">
        <span>🎉 Six! Roll Again! 🎉</span>
      </div>
    {/if}
  </div>
  
  <!-- Dice value display -->
  <div class="dice-value">
    <span class="value-number {colorClass}">{value}</span>
    {#if !isRolling && value === 6}
      <span class="bonus-text">Extra Turn!</span>
    {/if}
  </div>
</div>

<style>
  .dice-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }
  
  .dice {
    position: relative;
    width: 80px;
    height: 80px;
    background: linear-gradient(145deg, #ffffff, #e6e6e6);
    border: 3px solid #333;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.2),
      inset 0 1px 0 rgba(255,255,255,0.5);
    user-select: none;
  }
  
  .dice:hover.can-roll {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 6px 12px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.5);
  }
  
  .dice:active.can-roll {
    transform: translateY(0) scale(0.98);
  }
  
  .dice.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }
  
  .dice.rolling {
    animation: shake 0.1s infinite;
  }
  
  .dice-face {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }
  
  .dot {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #333;
    border-radius: 50%;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
  }
  
  /* Player color themes */
  .dice-red {
    background: linear-gradient(145deg, #ff6b6b, #d43230);
    border-color: #b71c1c;
  }
  
  .dice-red .dot {
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  
  .dice-blue {
    background: linear-gradient(145deg, #4dabf7, #2073b5);
    border-color: #1565c0;
  }
  
  .dice-blue .dot {
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  
  .dice-yellow {
    background: linear-gradient(145deg, #ffd43b, #f6c500);
    border-color: #f57f17;
  }
  
  .dice-yellow .dot {
    background: #333;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
  }
  
  .dice-green {
    background: linear-gradient(145deg, #51cf66, #239746);
    border-color: #2e7d32;
  }
  
  .dice-green .dot {
    background: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  
  .dice-default {
    background: linear-gradient(145deg, #ffffff, #e6e6e6);
    border-color: #333;
  }
  
  /* Hints and indicators */
  .roll-hint {
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .dice:hover .roll-hint {
    opacity: 1;
  }
  
  .rolling-indicator {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    animation: pulse 1s infinite;
  }
  
  .six-highlight {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(45deg, #ffd700, #ff6b35);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.6rem;
    font-weight: bold;
    white-space: nowrap;
    animation: bounce 1s infinite, glow 2s infinite;
    box-shadow: 0 2px 8px rgba(255,215,0,0.4);
  }
  
  /* Dice value display */
  .dice-value {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .value-number {
    font-size: 2rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
    min-width: 3rem;
    text-align: center;
    background: rgba(255,255,255,0.9);
    border: 2px solid;
    transition: all 0.3s ease;
  }
  
  .value-number.dice-red {
    color: #d43230;
    border-color: #d43230;
  }
  
  .value-number.dice-blue {
    color: #2073b5;
    border-color: #2073b5;
  }
  
  .value-number.dice-yellow {
    color: #f6c500;
    border-color: #f6c500;
  }
  
  .value-number.dice-green {
    color: #239746;
    border-color: #239746;
  }
  
  .value-number.dice-default {
    color: #333;
    border-color: #333;
  }
  
  .bonus-text {
    font-size: 0.8rem;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    animation: pulse 1.5s infinite;
  }
  
  /* Animations */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px) rotate(-1deg); }
    75% { transform: translateX(2px) rotate(1deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.95); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
    40% { transform: translateX(-50%) translateY(-5px); }
    60% { transform: translateX(-50%) translateY(-3px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 2px 8px rgba(255,215,0,0.4); }
    50% { box-shadow: 0 4px 16px rgba(255,215,0,0.8); }
  }
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .dice {
      width: 60px;
      height: 60px;
    }
    
    .dot {
      width: 8px;
      height: 8px;
    }
    
    .value-number {
      font-size: 1.5rem;
    }
    
    .roll-hint,
    .rolling-indicator,
    .six-highlight {
      font-size: 0.6rem;
    }
  }
  
  /* Focus styles for accessibility */
  .dice:focus {
    outline: 3px solid #4dabf7;
    outline-offset: 2px;
  }
</style>
