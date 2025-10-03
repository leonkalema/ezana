<script lang="ts">
  export let onSquareClick = (data: any) => console.log('Square clicked:', data);
</script>

<svelte:head>
  <script src="https://kit.fontawesome.com/eb3d4e59bc.js" crossorigin="anonymous"></script>
</svelte:head>

<div class="board-container">
  <div class="ludo">
    <div class="Cuadro-yellow">
      <div class="cuadrado-t-y">
        <div class="circulo1 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 1})}></div>
        <div class="circulo2 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 2})}></div>
        <div class="circulo3 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 3})}></div>
        <div class="circulo4 y" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 4})}></div>
      </div>
    </div>
    <div class="cuadradost1" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't1'})}></div>
    <div class="cuadradost2" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't2'})}></div>
    <div class="cuadradost3" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't3'})}>
      <i class="far fa-star"></i>
    </div>
    <div class="cuadradost4" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't4'})}></div>
    <div class="cuadradost5" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't5'})}></div>
    <div class="cuadradost6" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't6'})}></div>
    <div class="cuadradost7" role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'yellow'})}>
      <i class="fas fa-chevron-down"></i>
    </div>
    <div class="cuadradost8" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 1})}></div>
    <div class="cuadradost9" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 2})}></div>
    <div class="cuadradost10" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 3})}></div>
    <div class="cuadradost11" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 4})}></div>
    <div class="cuadradost12" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 5})}></div>
    <div class="cuadradost13" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't13'})}></div>
    <div class="cuadradost14" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't14'})}>
      <i class="far fa-star"></i>
    </div>
    <div class="cuadradost15" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't15'})}></div>
    <div class="cuadradost16" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't16'})}></div>
    <div class="cuadradost17" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't17'})}></div>
    <div class="cuadradost18" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't18'})}></div>

    <div class="Cuadro-red">
      <div class="cuadrado-t-r">
        <div class="circulo1 r" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 1})}></div>
        <div class="circulo2 r" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 2})}></div>
        <div class="circulo3 r" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 3})}></div>
        <div class="circulo4 r" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 4})}></div>
      </div>
    </div>
    
    <!-- Continue with all squares following your exact structure... -->
    <div class="cuadro-medio"></div>
  </div>
</div>

<style>
  .board-container {
    display: flex;
    align-items: center;
    justify-content: center;
    background: black;
    padding: 1rem;
  }
  
  .ludo {
    display: grid;
    grid-template-columns: repeat(15, min(6vw, 40px));
    grid-template-rows: repeat(15, min(6vw, 40px));
    grid-gap: 2px;
  }
  
  .Cuadro-red,
  .Cuadro-blue,
  .Cuadro-yellow,
  .Cuadro-green {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 3px;
  }

  .Cuadro-red {
    border-radius: 25px 0 0 0;
    grid-column: 1/7;
    grid-row: 1/7;
    background: var(--color-l);
  }
  .Cuadro-yellow {
    border-radius: 0 25px 0 0;
    grid-column: 10/16;
    grid-row: 1/7;
    background: var(--color-t);
  }
  .Cuadro-green {
    border-radius: 0 0 25px 0;
    grid-column: 10/16;
    grid-row: 10/16;
    background: var(--color-r);
  }
  .Cuadro-blue {
    border-radius: 0 0 0 25px;
    grid-column: 1/7;
    grid-row: 10/16;
    background: var(--color-b);
  }
  
  .cuadrado-t-r,
  .cuadrado-t-y,
  .cuadrado-t-g,
  .cuadrado-t-b {
    background: var(--color-main);
    grid-row: 2/6;
    grid-column: 2/6;
    display: grid;
    grid-template-rows: repeat(5, 1fr);
    grid-template-columns: repeat(5, 1fr);
    border-radius: 20px;
    border: 2px solid black;
  }
  
  .circulo1,
  .circulo2,
  .circulo3,
  .circulo4 {
    border-radius: 50%;
    background: #c6c6c6;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .circulo1:hover,
  .circulo2:hover,
  .circulo3:hover,
  .circulo4:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .circulo1 {
    grid-row: 2/3;
    grid-column: 2/3;
  }
  .circulo2 {
    grid-row: 4/5;
    grid-column: 2/3;
  }
  .circulo3 {
    grid-row: 2/3;
    grid-column: 4/5;
  }
  .circulo4 {
    grid-row: 4/5;
    grid-column: 4/5;
  }
  
  .cuadro-medio {
    grid-column: 7/10;
    grid-row: 7/10;
    height: 0;
    width: 0;
    border-top: min(3.5vw, 62px) solid var(--color-t);
    border-left: min(3.5vw, 62px) solid var(--color-l);
    border-bottom: min(3.5vw, 62px) solid var(--color-b);
    border-right: min(3.5vw, 62px) solid var(--color-r);
  }
  
  /* Path squares */
  .cuadradost1,
  .cuadradost2,
  .cuadradost4,
  .cuadradost5,
  .cuadradost6,
  .cuadradost13,
  .cuadradost15,
  .cuadradost16,
  .cuadradost17,
  .cuadradost18 {
    background: var(--color-main);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cuadradost1 { grid-column: var(--grid-1); grid-row: 1/2; }
  .cuadradost2 { grid-column: var(--grid-1); grid-row: 2/3; }
  .cuadradost3 { 
    background: gray; 
    grid-column: var(--grid-1); 
    grid-row: 3/4;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .cuadradost4 { grid-column: var(--grid-1); grid-row: 4/5; }
  .cuadradost5 { grid-column: var(--grid-1); grid-row: 5/6; }
  .cuadradost6 { grid-column: var(--grid-1); grid-row: 6/7; }
  
  .cuadradost7,
  .cuadradost8,
  .cuadradost9,
  .cuadradost10,
  .cuadradost11,
  .cuadradost12 {
    background: var(--color-t);
    grid-column: var(--grid-2);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cuadradost7 { 
    grid-row: 1/2; 
    background: var(--color-main);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .cuadradost8 { grid-row: 2/3; }
  .cuadradost9 { grid-row: 3/4; }
  .cuadradost10 { grid-row: 4/5; }
  .cuadradost11 { grid-row: 5/6; }
  .cuadradost12 { grid-row: 6/7; }
  
  .cuadradost13 { grid-column: var(--grid-3); grid-row: 1/2; }
  .cuadradost14 { 
    background: var(--color-t); 
    grid-column: var(--grid-3); 
    grid-row: 2/3;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .cuadradost15 { grid-column: var(--grid-3); grid-row: 3/4; }
  .cuadradost16 { grid-column: var(--grid-3); grid-row: 4/5; }
  .cuadradost17 { grid-column: var(--grid-3); grid-row: 5/6; }
  .cuadradost18 { grid-column: var(--grid-3); grid-row: 6/7; }
  
  /* Hover effects */
  [role="button"]:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  /* Icons */
  .far,
  .fas {
    color: white;
    font-size: min(1.8rem, 4vw);
  }
  
  .cuadradost3 .far,
  .cuadradost14 .far {
    font-weight: bold;
  }
  
  .cuadradost7 .fas {
    color: var(--color-t);
  }
  
  /* CSS Variables */
  :root {
    --grid-1: 7/8;
    --grid-2: 8/9;
    --grid-3: 9/10;
    --color-main: white;
    --color-r: #239746;
    --color-t: #f6c500;
    --color-b: #2073b5;
    --color-l: #d43230;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .ludo {
      grid-template-columns: repeat(15, min(5vw, 30px));
      grid-template-rows: repeat(15, min(5vw, 30px));
      grid-gap: 1px;
    }
    
    .far,
    .fas {
      font-size: min(1.2rem, 3vw);
    }
  }
</style>
