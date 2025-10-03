<script lang="ts">
  export let onSquareClick = (data: any) => console.log('Square clicked:', data);
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
          <div class="flex flex-wrap justify-center items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[8%] p-[8%] box-border">
            <div class="w-[18%] h-[18%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 1})}></div>
            <div class="w-[18%] h-[18%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 2})}></div>
            <div class="w-[18%] h-[18%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 3})}></div>
            <div class="w-[18%] h-[18%] bg-red-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'red', slot: 4})}></div>
        </div>
      </div>
      
      <!-- Top Path -->
      <div class="flex flex-wrap w-[20%] h-[40%]">
        <div class="w-1/3 border border-t-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't1'})}></div>
        <div class="w-1/3 border border-t-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'green'})}>
          <i class='fas fa-long-arrow-alt-down inline-block absolute text-green-600 animate-pulse'></i>
        </div>
        <div class="w-1/3 border border-t-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't3'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't4'})}></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 1})}></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 2})}></div>
        <div class="w-1/3 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't7'})}>
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-green-500'></i>
        </div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 3})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't9'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't10'})}></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 4})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't12'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't13'})}></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 5})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't15'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't16'})}></div>
        <div class="w-1/3 border border-black box-border bg-green-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'green', position: 6})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 't18'})}></div>
      </div>
      
      <!-- Green Corner -->
      <div class="flex justify-center items-center w-[40%] h-[40%] bg-green-600 border border-r-2 border-t-2 border-black box-border">
        <div class="flex flex-wrap justify-center items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[8%] p-[8%] box-border">
          <div class="w-[18%] h-[18%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 1})}></div>
          <div class="w-[18%] h-[18%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 2})}></div>
          <div class="w-[18%] h-[18%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 3})}></div>
          <div class="w-[18%] h-[18%] bg-green-600 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'green', slot: 4})}></div>
        </div>
      </div>
      
      <!-- Left Path -->
      <div class="flex flex-wrap w-[40%] h-[20%]">
        <div class="w-1/6 border border-l-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l1'})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 1})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l3'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l4'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l5'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l6'})}></div>
        <div class="w-1/6 border border-l-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'red'})}>
          <i class='fas fa-long-arrow-alt-right inline-block absolute text-red-600 animate-pulse'></i>
        </div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 2})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 3})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 4})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 5})}></div>
        <div class="w-1/6 border border-black box-border bg-red-600 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'red', position: 6})}></div>
        <div class="w-1/6 border border-l-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l13'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l14'})}></div>
        <div class="w-1/6 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l15'})}>
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-sky-500'></i>
        </div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l16'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l17'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'l18'})}></div>
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
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r1'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r2'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r3'})}></div>
        <div class="w-1/6 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r4'})}>
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-yellow-400'></i>
        </div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r5'})}></div>
        <div class="w-1/6 border border-r-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r6'})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 1})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 2})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 3})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 4})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 5})}></div>
        <div class="w-1/6 border border-r-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'yellow'})}>
          <i class='fas fa-long-arrow-alt-left inline-block absolute text-yellow-400 animate-pulse'></i>
        </div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r13'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r14'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r15'})}></div>
        <div class="w-1/6 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r16'})}></div>
        <div class="w-1/6 border border-black box-border bg-yellow-400 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'yellow', position: 6})}></div>
        <div class="w-1/6 border border-r-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'r18'})}></div>
      </div>
      
      <!-- Blue Corner -->
      <div class="flex justify-center items-center w-[40%] h-[40%] bg-sky-500 border border-l-2 border-b-2 border-black box-border">
        <div class="flex flex-wrap justify-center items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[8%] p-[8%] box-border">
          <div class="w-[18%] h-[18%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 1})}></div>
          <div class="w-[18%] h-[18%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 2})}></div>
          <div class="w-[18%] h-[18%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 3})}></div>
          <div class="w-[18%] h-[18%] bg-sky-500 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'blue', slot: 4})}></div>
        </div>
      </div>
      
      <!-- Bottom Path -->
      <div class="flex flex-wrap w-[20%] h-[40%]">
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b1'})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 1})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b3'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b4'})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 2})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b6'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b7'})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 3})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b9'})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b10'})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 4})}></div>
        <div class="w-1/3 border border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b12'})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 5})}></div>
        <div class="w-1/3 border border-black box-border bg-sky-500 cursor-pointer hover:opacity-80" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home-path', color: 'blue', position: 6})}></div>
        <div class="w-1/3 border border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b15'})}>
          <i class='fas fa-star inline-block absolute text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-yellow-400'></i>
        </div>
        <div class="w-1/3 border border-b-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b16'})}></div>
        <div class="w-1/3 border border-b-2 border-black box-border flex justify-center items-center cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'entry', color: 'blue'})}>
          <i class='fas fa-long-arrow-alt-up inline-block absolute text-sky-500 animate-pulse'></i>
        </div>
        <div class="w-1/3 border border-b-2 border-black box-border cursor-pointer hover:bg-gray-100" role="button" tabindex="0" on:click={() => onSquareClick({type: 'path', position: 'b18'})}></div>
      </div>
      
      <!-- Yellow Corner -->
      <div class="flex justify-center items-center w-[40%] h-[40%] bg-yellow-400 border border-r-2 border-b-2 border-black box-border">
        <div class="flex flex-wrap justify-center items-center w-[70%] h-[70%] bg-white border-2 border-black gap-[8%] p-[8%] box-border">
          <div class="w-[18%] h-[18%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 1})}></div>
          <div class="w-[18%] h-[18%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 2})}></div>
          <div class="w-[18%] h-[18%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 3})}></div>
          <div class="w-[18%] h-[18%] bg-yellow-400 border-2 border-black rounded-full box-border cursor-pointer hover:scale-110 transition-transform" role="button" tabindex="0" on:click={() => onSquareClick({type: 'home', color: 'yellow', slot: 4})}></div>
        </div>
      </div>
    </div>
  </div>
</div>
