<script lang="ts">
  import type { Player } from '$lib/types/ludo';

  type CellOccupant = {
    readonly id: number;
    readonly player: Player;
  };

  interface BoardPieces {
    readonly track: Readonly<Record<string, ReadonlyArray<CellOccupant>>>;
    readonly home: Readonly<Record<Player, ReadonlyArray<CellOccupant>>>;
  }

  const emptyList: ReadonlyArray<CellOccupant> = [];
  const defaultPieces: BoardPieces = {
    track: {},
    home: {
      red: emptyList,
      blue: emptyList,
      yellow: emptyList,
      green: emptyList
    }
  };

  export let onSquareClick: (data: unknown) => void = (data: unknown): void => {
    console.log('Square clicked:', data);
  };
  export let highlightIds: ReadonlyArray<string> = [];
  export let pieces: BoardPieces = defaultPieces;

  const h = (id: string): boolean => highlightIds.includes(id);

  const cellNodes: Record<string, HTMLElement> = {};
  const homePattern = /^home-(red|blue|yellow|green)-(\d+)$/;

  const tokensFor = (id: string): ReadonlyArray<CellOccupant> => {
    const match = homePattern.exec(id);
    if (match) {
      const player = match[1] as Player;
      const slot = Number(match[2]) - 1;
      const homePieces = pieces.home[player] ?? emptyList;
      if (slot >= 0 && slot < homePieces.length) {
        return [homePieces[slot]!];
      }
      return emptyList;
    }
    return pieces.track[id] ?? emptyList;
  };

  const applyTokens = (id: string): void => {
    const node = cellNodes[id];
    if (!node) return;
    const existingStacks = Array.from(node.querySelectorAll(':scope > .token-stack'));
    existingStacks.forEach((stack) => stack.remove());
    const occupants = tokensFor(id);
    if (!occupants.length) return;
    const stack = document.createElement('div');
    stack.className = 'token-stack';
    occupants.forEach((occ) => {
      const span = document.createElement('span');
      span.className = `token token-${occ.player}`;
      span.setAttribute('data-player', occ.player);
      span.textContent = '';
      stack.appendChild(span);
    });
    node.appendChild(stack);
  };

  const tokenCell = (node: HTMLElement, id: string) => {
    cellNodes[id] = node;
    applyTokens(id);
    return {
      update(nextId: string) {
        if (nextId === id) {
          applyTokens(nextId);
          return;
        }
        delete cellNodes[id];
        cellNodes[nextId] = node;
        id = nextId;
        applyTokens(id);
      },
      destroy() {
        delete cellNodes[id];
      }
    };
  };

  const clickable = (node: HTMLElement, data: unknown) => {
    let payload = data;
    const handleClick = () => onSquareClick(payload);
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key;
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        onSquareClick(payload);
      }
    };
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.addEventListener('click', handleClick);
    node.addEventListener('keydown', handleKey);
    return {
      update(next: unknown) {
        payload = next;
      },
      destroy() {
        node.removeEventListener('click', handleClick);
        node.removeEventListener('keydown', handleKey);
      }
    };
  };

  $: {
    for (const id of Object.keys(cellNodes)) {
      applyTokens(id);
    }
  }
</script>

<svelte:head>
  <script src="https://kit.fontawesome.com/eb3d4e59bc.js" crossorigin="anonymous"></script>
</svelte:head>

<div class="w-full max-w-full" style="aspect-ratio: 1/1; position: relative;">
  <div
    class="bg-white overflow-hidden box-border absolute inset-0"
    style="width: 100%; height: 100%;"
  >
    <div class="flex flex-wrap justify-start items-start w-full h-full">
        <!-- Red Corner -->
        <div class="flex justify-center items-center w-[40%] h-[40%] bg-red-600 border border-l-2 border-t-2 border-black box-border">
          <div class="grid grid-cols-2 grid-rows-2 place-items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[12%] p-[8%] box-border">
            <div class="w-[60%] h-[60%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" use:clickable={{type: 'home', color: 'red', slot: 1}} data-cell-id="home-red-1"></div>
            <div class="w-[60%] h-[60%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" use:clickable={{type: 'home', color: 'red', slot: 2}} data-cell-id="home-red-2"></div>
            <div class="w-[60%] h-[60%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" use:clickable={{type: 'home', color: 'red', slot: 3}} data-cell-id="home-red-3"></div>
            <div class="w-[60%] h-[60%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" use:clickable={{type: 'home', color: 'red', slot: 4}} data-cell-id="home-red-4"></div>
          </div>
        </div>
      
      <!-- Top Path -->
      <div class="flex flex-wrap w-[20%] h-[40%]">
        <div class="w-1/3 border border-t-2 border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t1')} use:tokenCell={'t1'} use:clickable={{type: 'path', position: 't1'}} data-cell-id="t1"></div>
        <div class="w-1/3 border border-t-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" class:highlight={h('entry-green')} use:tokenCell={'entry-green'} use:clickable={{type: 'entry', color: 'green'}} data-cell-id="entry-green">
          <i class='fas fa-long-arrow-alt-down inline-block absolute text-green-600 animate-pulse'></i>
        </div>
        <div class="w-1/3 border border-t-2 border-black box-border cursor-pointer hover:bg-gray-100" use:tokenCell={'t3'} use:clickable={{type: 'path', position: 't3'}} data-cell-id="t3"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t4')} use:tokenCell={'t4'} use:clickable={{type: 'path', position: 't4'}} data-cell-id="t4"></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" use:clickable={{type: 'home-path', color: 'green', position: 1}}></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" use:clickable={{type: 'home-path', color: 'green', position: 2}}></div>
        <div class="w-1/3 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" class:highlight={h('t7')} use:tokenCell={'t7'} use:clickable={{type: 'path', position: 't7'}} data-cell-id="t7">
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-green-500'></i>
        </div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" use:clickable={{type: 'home-path', color: 'green', position: 3}}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t9')} use:tokenCell={'t9'} use:clickable={{type: 'path', position: 't9'}} data-cell-id="t9"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t10')} use:tokenCell={'t10'} use:clickable={{type: 'path', position: 't10'}} data-cell-id="t10"></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" use:clickable={{type: 'home-path', color: 'green', position: 4}}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t12')} use:tokenCell={'t12'} use:clickable={{type: 'path', position: 't12'}} data-cell-id="t12"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t13')} use:tokenCell={'t13'} use:clickable={{type: 'path', position: 't13'}} data-cell-id="t13"></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" use:clickable={{type: 'home-path', color: 'green', position: 5}}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t15')} use:tokenCell={'t15'} use:clickable={{type: 'path', position: 't15'}} data-cell-id="t15"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('t16')} use:tokenCell={'t16'} use:clickable={{type: 'path', position: 't16'}} data-cell-id="t16"></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" use:clickable={{type: 'home-path', color: 'green', position: 6}}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" use:tokenCell={'t18'} use:clickable={{type: 'path', position: 't18'}} data-cell-id="t18"></div>
      </div>
      
      <!-- Green Corner -->
      <div class="flex justify-center items-center w-[40%] h-[40%] bg-green-600 border border-r-2 border-t-2 border-black box-border">
        <div class="grid grid-cols-2 grid-rows-2 place-items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[12%] p-[8%] box-border">
          <div class="w-[60%] h-[60%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 1})}></div>
          <div class="w-[60%] h-[60%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 2})}></div>
          <div class="w-[60%] h-[60%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 3})}></div>
          <div class="w-[60%] h-[60%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 4})}></div>
        </div>
      </div>
      
      <!-- Left Path -->
      <div class="flex flex-wrap w-[40%] h-[20%]">
        <div class="w-1/6 border border-l-2 border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('l1')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l1'})} data-cell-id="l1"></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 1})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l3'})} data-cell-id="l3"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l4'})} data-cell-id="l4"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l5'})} data-cell-id="l5"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l6'})} data-cell-id="l6"></div>
        <div class="w-1/6 border border-l-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" class:highlight={h('entry-red')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'red'})} data-cell-id="entry-red">
          <i class='fas fa-long-arrow-alt-right inline-block absolute text-red-600 animate-pulse'></i>
        </div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 2})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 3})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 4})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 5})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 6})}></div>
        <div class="w-1/6 border border-l-2 border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('l13')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l13'})} data-cell-id="l13"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('l14')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l14'})} data-cell-id="l14"></div>
        <div class="w-1/6 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l15'})} data-cell-id="l15">
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-sky-500'></i>
        </div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('l16')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l16'})} data-cell-id="l16"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('l17')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l17'})} data-cell-id="l17"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('l18')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l18'})} data-cell-id="l18"></div>
      </div>
      
      <!-- Center -->
      <div class="w-[20%] h-[20%] overflow-hidden relative">
        <div class="w-full h-full bg-yellow-400 rotate-45 left-[49.5%] absolute border-2 border-black"></div>
        <div class="w-full h-full bg-sky-500 rotate-45 top-[55.5%] absolute"></div>
        <div class="w-full h-full bg-green-600 rotate-45 top-[-55.5%] absolute"></div>
        <div class="w-full h-full bg-red-600 rotate-45 left-[-55.5%] absolute border-2 border-black"></div>
      </div>
      
      <!-- Right Path -->
      <div class="flex flex-wrap w-[40%] h-[20%]">
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r1')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r1'})} data-cell-id="r1"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r2')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r2'})} data-cell-id="r2"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r3')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r3'})} data-cell-id="r3"></div>
        <div class="w-1/6 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" class:highlight={h('r4')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r4'})} data-cell-id="r4">
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-yellow-400'></i>
        </div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r5')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r5'})} data-cell-id="r5"></div>
        <div class="w-1/6 border border-r-2 border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r6')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r6'})} data-cell-id="r6"></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 1})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 2})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 3})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 4})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 5})}></div>
        <div class="w-1/6 border border-r-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" class:highlight={h('entry-yellow')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'yellow'})} data-cell-id="entry-yellow">
          <i class='fas fa-long-arrow-alt-left inline-block absolute text-yellow-400 animate-pulse'></i>
        </div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r13')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r13'})} data-cell-id="r13"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r14')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r14'})} data-cell-id="r14"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r15')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r15'})} data-cell-id="r15"></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('r16')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r16'})} data-cell-id="r16"></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 6})}></div>
        <div class="w-1/6 border border-r-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r18'})} data-cell-id="r18"></div>
      </div>
      
      <!-- Blue Corner -->
      <div class="flex justify-center items-center w-[40%] h-[40%] bg-sky-500 border border-l-2 border-b-2 border-black box-border">
        <div class="grid grid-cols-2 grid-rows-2 place-items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[12%] p-[8%] box-border">
          <div class="w-[60%] h-[60%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 1})}></div>
          <div class="w-[60%] h-[60%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 2})}></div>
          <div class="w-[60%] h-[60%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 3})}></div>
          <div class="w-[60%] h-[60%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 4})}></div>
        </div>
      </div>
      
      <!-- Bottom Path -->
      <div class="flex flex-wrap w-[20%] h-[40%]">
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b1')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b1'})} data-cell-id="b1"></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 1})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b3')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b3'})} data-cell-id="b3"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b4')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b4'})} data-cell-id="b4"></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 2})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b6')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b6'})} data-cell-id="b6"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b7')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b7'})} data-cell-id="b7"></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 3})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b9')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b9'})} data-cell-id="b9"></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b10'})} data-cell-id="b10"></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 4})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b12'})} data-cell-id="b12"></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 5})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 6})}></div>
        <div class="w-1/3 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b15'})} data-cell-id="b15">
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-yellow-400'></i>
        </div>
        <div class="w-1/3 border border-b-2 border-black box-border cursor-pointer hover:bg-gray-100" class:highlight={h('b16')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b16'})} data-cell-id="b16"></div>
        <div class="w-1/3 border border-b-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" class:highlight={h('entry-blue')} role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'blue'})} data-cell-id="entry-blue">
          <i class='fas fa-long-arrow-alt-up inline-block absolute text-sky-500 animate-pulse'></i>
        </div>
        <div class="w-1/3 border border-b-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b18'})} data-cell-id="b18"></div>
      </div>
      
      <!-- Yellow Corner -->
      <div class="flex justify-center items-center w-[40%] h-[40%] bg-yellow-400 border border-r-2 border-b-2 border-black box-border">
        <div class="grid grid-cols-2 grid-rows-2 place-items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[12%] p-[8%] box-border">
          <div class="w-[60%] h-[60%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 1})}></div>
          <div class="w-[60%] h-[60%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 2})}></div>
          <div class="w-[60%] h-[60%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 3})}></div>
          <div class="w-[60%] h-[60%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 4})}></div>
        </div>
      </div>
    </div>
  </div>
</div>
