<script lang="ts">
  import LudoBoard from '$lib/components/game/ludo-board-tailwind.svelte';
  import Dice from '$lib/components/game/dice.svelte';
  
  // Test state
  let diceValue = 1;
  let isRolling = false;
  let canRoll = true;
  let currentPlayer: 'red' | 'blue' | 'yellow' | 'green' = 'red';
  let gameLog: string[] = [];
  
  // Mock game state
  let mockGameState = {
    currentPlayer: 'red',
    pieces: {
      red: [
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'path', pathPosition: 5 },
        { id: 4, position: 'home' }
      ],
      blue: [
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'home' },
        { id: 4, position: 'home' }
      ],
      yellow: [
        { id: 1, position: 'home' },
        { id: 2, position: 'path', pathPosition: 12 },
        { id: 3, position: 'home' },
        { id: 4, position: 'home' }
      ],
      green: [
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'home' },
        { id: 4, position: 'home' }
      ]
    }
  };
  
  function handleDiceRoll(event: CustomEvent) {
    const { value } = event.detail;
    diceValue = value;
    
    // Add to game log
    gameLog = [`${currentPlayer.toUpperCase()} rolled ${value}`, ...gameLog.slice(0, 9)];
    
    // Switch player (unless rolled 6)
    if (value !== 6) {
      const players: ('red' | 'blue' | 'yellow' | 'green')[] = ['red', 'blue', 'yellow', 'green'];
      const currentIndex = players.indexOf(currentPlayer);
      currentPlayer = players[(currentIndex + 1) % 4];
    }
  }
  
  function handleSquareClick(event: CustomEvent) {
    const clickData = event.detail;
    gameLog = [`Clicked: ${JSON.stringify(clickData)}`, ...gameLog.slice(0, 9)];
  }
  
  function resetTest() {
    diceValue = 1;
    isRolling = false;
    currentPlayer = 'red';
    gameLog = ['Game reset'];
  }
  
  function simulateRoll(value: number) {
    diceValue = value;
    gameLog = [`Simulated roll: ${value}`, ...gameLog.slice(0, 9)];
  }
</script>

<svelte:head>
  <title>Ludo UI Test - Binojo</title>
  <script src="https://kit.fontawesome.com/eb3d4e59bc.js" crossorigin="anonymous"></script>
</svelte:head>

<div class="test-container">
  <div class="test-header">
    <h1>🎲 Ludo UI Test</h1>
    <p>Testing Ludo board and dice components</p>
  </div>
  
  <div class="test-content">
    <!-- Game Controls -->
    <div class="controls-panel">
      <h3>Game Controls</h3>
      
      <div class="current-player">
        <span>Current Player:</span>
        <div class="player-indicator player-{currentPlayer}">
          {currentPlayer.toUpperCase()}
        </div>
      </div>
      
      <div class="dice-section">
        <h4>Dice</h4>
        <Dice 
          bind:value={diceValue}
          bind:isRolling={isRolling}
          {canRoll}
          playerColor={currentPlayer}
          on:rollStart={() => gameLog = ['Rolling dice...', ...gameLog.slice(0, 9)]}
          on:rollComplete={handleDiceRoll}
        />
      </div>
      
      <div class="test-buttons">
        <h4>Test Controls</h4>
        <button on:click={resetTest} class="btn btn-secondary">
          🔄 Reset Game
        </button>
        
        <div class="simulate-rolls">
          <span>Simulate Roll:</span>
          {#each [1, 2, 3, 4, 5, 6] as num}
            <button 
              on:click={() => simulateRoll(num)} 
              class="btn btn-small btn-{num === 6 ? 'special' : 'primary'}"
            >
              {num}
            </button>
          {/each}
        </div>
        
        <div class="player-switch">
          <span>Switch Player:</span>
          {#each ['red', 'blue', 'yellow', 'green'] as color}
            <button 
              on:click={() => currentPlayer = color} 
              class="btn btn-small player-btn player-{color}"
              class:active={currentPlayer === color}
            >
              {color[0].toUpperCase()}
            </button>
          {/each}
        </div>
      </div>
      
      <div class="game-log">
        <h4>Game Log</h4>
        <div class="log-content">
          {#each gameLog as logEntry}
            <div class="log-entry">{logEntry}</div>
          {/each}
          {#if gameLog.length === 0}
            <div class="log-entry empty">No actions yet...</div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Ludo Board -->
    <div class="board-section">
        <LudoBoard 
          onSquareClick={handleSquareClick}
        />
    </div>
  </div>
  
  <div class="test-info">
    <h3>🧪 Test Instructions</h3>
    <ul>
      <li><strong>Roll Dice:</strong> Click the dice or use spacebar/enter</li>
      <li><strong>Board Interaction:</strong> Click any square on the board</li>
      <li><strong>Player Switch:</strong> Use player buttons or roll dice (auto-switch unless 6)</li>
      <li><strong>Simulate Rolls:</strong> Use number buttons to test specific dice values</li>
      <li><strong>Special Effects:</strong> Roll a 6 to see celebration effects</li>
      <li><strong>Responsive:</strong> Resize window to test mobile layout</li>
    </ul>
  </div>
</div>

<style>
  .test-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
  }
  
  .test-header {
    text-align: center;
    color: white;
    margin-bottom: 2rem;
  }
  
  .test-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .test-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .controls-panel {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    height: fit-content;
    position: sticky;
    top: 2rem;
  }
  
  .controls-panel h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  .controls-panel h4 {
    color: #666;
    margin: 1.5rem 0 0.5rem 0;
    font-size: 1rem;
  }
  
  .current-player {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .player-indicator {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  }
  
  .player-indicator.player-red { background: #d43230; }
  .player-indicator.player-blue { background: #2073b5; }
  .player-indicator.player-yellow { background: #f6c500; }
  .player-indicator.player-green { background: #239746; }
  
  .dice-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .test-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-special {
    background: linear-gradient(45deg, #ffd700, #ff6b35);
    color: white;
    font-weight: bold;
  }
  
  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .simulate-rolls,
  .player-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .player-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
  }
  
  .player-btn.player-red { background: #d43230; }
  .player-btn.player-blue { background: #2073b5; }
  .player-btn.player-yellow { background: #f6c500; }
  .player-btn.player-green { background: #239746; }
  
  .player-btn.active {
    box-shadow: 0 0 0 3px rgba(0,123,255,0.5);
  }
  
  .game-log {
    margin-top: 1rem;
  }
  
  .log-content {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 1rem;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .log-entry {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .log-entry:last-child {
    border-bottom: none;
  }
  
  .log-entry.empty {
    color: #999;
    font-style: italic;
  }
  
  .board-section {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .test-info {
    background: rgba(255,255,255,0.9);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 2rem;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .test-info h3 {
    color: #333;
    margin-top: 0;
  }
  
  .test-info ul {
    list-style: none;
    padding: 0;
  }
  
  .test-info li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .test-info li:last-child {
    border-bottom: none;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 1024px) {
    .test-content {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .controls-panel {
      position: static;
      order: 2;
    }
    
    .board-section {
      order: 1;
    }
  }
  
  @media (max-width: 768px) {
    .test-container {
      padding: 1rem;
    }
    
    .test-header h1 {
      font-size: 2rem;
    }
    
    .controls-panel {
      padding: 1rem;
    }
  }
</style>
