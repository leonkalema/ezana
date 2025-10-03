<script lang="ts">
  export let gameState: any = null;
  export let playerColor: 'red' | 'blue' | 'yellow' | 'green' | null = null;
  export let onSquareClick: (position: any) => void = () => {};
</script>

<div class="ludo-container">
  <div class="ludo">
    <div class="Cuadro-yellow">
      <div class="cuadrado-t-y">
        <div class="circulo1 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 1})} on:keydown></div>
        <div class="circulo2 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 2})} on:keydown></div>
        <div class="circulo3 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 3})} on:keydown></div>
        <div class="circulo4 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 4})} on:keydown></div>
      </div>
    </div>

    <!-- Top Path (Yellow to Red) -->
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 1})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 2})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 3})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 4})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 5})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 6})}></div>
    
    <!-- Yellow Entry -->
    <div class="entry-square entry-yellow" on:click={() => onSquareClick({type: 'entry', color: 'yellow'})}>
      <i class="fas fa-chevron-down"></i>
    </div>
    
    <!-- Yellow Home Path -->
    <div class="home-path home-path-yellow" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 1})}></div>
    <div class="home-path home-path-yellow" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 2})}></div>
    <div class="home-path home-path-yellow" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 3})}></div>
    <div class="home-path home-path-yellow" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 4})}></div>
    <div class="home-path home-path-yellow" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 5})}></div>
    
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 7})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 8})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 9})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 10})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 11})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 12})}></div>

    <!-- Red Corner -->
    <div class="corner corner-red">
      <div class="home-area home-red">
        <div class="piece-slot red" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 1})}>
          {#if pieces.red[0].position === 'home'}
            <div class="piece piece-red"></div>
          {/if}
        </div>
        <div class="piece-slot red" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 2})}>
          {#if pieces.red[1].position === 'home'}
            <div class="piece piece-red"></div>
          {/if}
        </div>
        <div class="piece-slot red" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 3})}>
          {#if pieces.red[2].position === 'home'}
            <div class="piece piece-red"></div>
          {/if}
        </div>
        <div class="piece-slot red" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 4})}>
          {#if pieces.red[3].position === 'home'}
            <div class="piece piece-red"></div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Left Path (Red to Blue) -->
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 13})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 14})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 15})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 16})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 17})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 18})}></div>
    
    <!-- Red Entry -->
    <div class="entry-square entry-red" on:click={() => onSquareClick({type: 'entry', color: 'red'})}>
      <i class="fas fa-chevron-right"></i>
    </div>
    
    <!-- Red Home Path -->
    <div class="home-path home-path-red" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 1})}></div>
    <div class="home-path home-path-red" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 2})}></div>
    <div class="home-path home-path-red" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 3})}></div>
    <div class="home-path home-path-red" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 4})}></div>
    <div class="home-path home-path-red" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 5})}></div>
    
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 19})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 20})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 21})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 22})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 23})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 24})}></div>

    <!-- Blue Corner -->
    <div class="corner corner-blue">
      <div class="home-area home-blue">
        <div class="piece-slot blue" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 1})}>
          {#if pieces.blue[0].position === 'home'}
            <div class="piece piece-blue"></div>
          {/if}
        </div>
        <div class="piece-slot blue" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 2})}>
          {#if pieces.blue[1].position === 'home'}
            <div class="piece piece-blue"></div>
          {/if}
        </div>
        <div class="piece-slot blue" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 3})}>
          {#if pieces.blue[2].position === 'home'}
            <div class="piece piece-blue"></div>
          {/if}
        </div>
        <div class="piece-slot blue" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 4})}>
          {#if pieces.blue[3].position === 'home'}
            <div class="piece piece-blue"></div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Bottom Path (Blue to Green) -->
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 25})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 26})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 27})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 28})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 29})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 30})}></div>
    
    <!-- Blue Home Path -->
    <div class="home-path home-path-blue" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 1})}></div>
    <div class="home-path home-path-blue" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 2})}></div>
    <div class="home-path home-path-blue" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 3})}></div>
    <div class="home-path home-path-blue" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 4})}></div>
    <div class="home-path home-path-blue" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 5})}></div>
    
    <!-- Blue Entry -->
    <div class="entry-square entry-blue" on:click={() => onSquareClick({type: 'entry', color: 'blue'})}>
      <i class="fas fa-chevron-up"></i>
    </div>
    
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 31})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 32})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 33})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 34})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 35})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 36})}></div>

    <!-- Green Corner -->
    <div class="corner corner-green">
      <div class="home-area home-green">
        <div class="piece-slot green" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 1})}>
          {#if pieces.green[0].position === 'home'}
            <div class="piece piece-green"></div>
          {/if}
        </div>
        <div class="piece-slot green" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 2})}>
          {#if pieces.green[1].position === 'home'}
            <div class="piece piece-green"></div>
          {/if}
        </div>
        <div class="piece-slot green" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 3})}>
          {#if pieces.green[2].position === 'home'}
            <div class="piece piece-green"></div>
          {/if}
        </div>
        <div class="piece-slot green" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 4})}>
          {#if pieces.green[3].position === 'home'}
            <div class="piece piece-green"></div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right Path (Green to Yellow) -->
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 37})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 38})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 39})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 40})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 41})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 42})}></div>
    
    <!-- Green Home Path -->
    <div class="home-path home-path-green" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 1})}></div>
    <div class="home-path home-path-green" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 2})}></div>
    <div class="home-path home-path-green" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 3})}></div>
    <div class="home-path home-path-green" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 4})}></div>
    <div class="home-path home-path-green" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 5})}></div>
    
    <!-- Green Entry -->
    <div class="entry-square entry-green" on:click={() => onSquareClick({type: 'entry', color: 'green'})}>
      <i class="fas fa-chevron-left"></i>
    </div>
    
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 43})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 44})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 45})}></div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 46})}></div>
    <div class="path-square safe-square" on:click={() => onSquareClick({type: 'path', position: 47})}>
      <i class="far fa-star"></i>
    </div>
    <div class="path-square" on:click={() => onSquareClick({type: 'path', position: 48})}></div>

    <!-- Center -->
    <div class="center-triangle"></div>
  </div>
</div>

<style>
  .ludo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    min-height: 100vh;
  }

  .ludo {
    display: grid;
    grid-template-columns: repeat(15, 1fr);
    grid-template-rows: repeat(15, 1fr);
    gap: 2px;
    width: min(90vw, 90vh);
    height: min(90vw, 90vh);
    max-width: 600px;
    max-height: 600px;
    background: #f0f0f0;
    border-radius: 10px;
    padding: 8px;
  }

  /* Corners */
  .corner {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 3px;
    padding: 8px;
  }

  .corner-red {
    grid-column: 1/7;
    grid-row: 1/7;
    background: #d43230;
    border-radius: 25px 0 0 0;
  }

  .corner-yellow {
    grid-column: 10/16;
    grid-row: 1/7;
    background: #f6c500;
    border-radius: 0 25px 0 0;
  }

  .corner-blue {
    grid-column: 1/7;
    grid-row: 10/16;
    background: #2073b5;
    border-radius: 0 0 0 25px;
  }

  .corner-green {
    grid-column: 10/16;
    grid-row: 10/16;
    background: #239746;
    border-radius: 0 0 25px 0;
  }

  /* Home Areas */
  .home-area {
    grid-row: 2/6;
    grid-column: 2/6;
    display: grid;
    grid-template-rows: repeat(2, 1fr);
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    background: white;
    border-radius: 20px;
    border: 2px solid black;
    padding: 8px;
  }

  .piece-slot {
    border-radius: 50%;
    background: #c6c6c6;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .piece-slot:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .piece {
    width: 80%;
    height: 80%;
    border-radius: 50%;
    border: 2px solid rgba(0,0,0,0.3);
    transition: all 0.2s ease;
  }

  .piece-red { background: #d43230; }
  .piece-yellow { background: #f6c500; }
  .piece-blue { background: #2073b5; }
  .piece-green { background: #239746; }

  /* Path Squares */
  .path-square {
    background: white;
    border: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .path-square:hover {
    background: #f0f0f0;
    transform: scale(1.02);
  }

  .safe-square {
    background: #e8e8e8;
  }

  .safe-square i {
    color: #666;
    font-size: 1.2rem;
  }

  /* Entry Squares */
  .entry-square {
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .entry-red i { color: #d43230; }
  .entry-yellow i { color: #f6c500; }
  .entry-blue i { color: #2073b5; }
  .entry-green i { color: #239746; }

  /* Home Paths */
  .home-path {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .home-path:hover {
    transform: scale(1.02);
  }

  .home-path-red { background: #d43230; }
  .home-path-yellow { background: #f6c500; }
  .home-path-blue { background: #2073b5; }
  .home-path-green { background: #239746; }

  /* Center Triangle */
  .center-triangle {
    grid-column: 7/10;
    grid-row: 7/10;
    width: 0;
    height: 0;
    border-top: calc(100% / 2) solid #f6c500;
    border-left: calc(100% / 2) solid #d43230;
    border-bottom: calc(100% / 2) solid #2073b5;
    border-right: calc(100% / 2) solid #239746;
    margin: auto;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .ludo {
      width: 95vw;
      height: 95vw;
      gap: 1px;
    }
    
    .safe-square i {
      font-size: 0.8rem;
    }
    
    .entry-square i {
      font-size: 0.8rem;
    }
  }
</style>
