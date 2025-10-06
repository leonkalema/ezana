<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number = 1;
  export let isRolling: boolean = false;
  export let canRoll: boolean = true;
  export let playerColor: 'red' | 'blue' | 'yellow' | 'green' | null = null;

  type FaceVector = readonly [number, number, number];

  const dispatch = createEventDispatcher();

  // Rotation vectors for each face (to front) matching the snippet you sent
  const perFace: readonly FaceVector[] = [
    [-0.1, 0.3, -1],
    [-0.1, 0.6, -0.4],
    [-0.85, -0.42, 0.73],
    [-0.8, 0.3, -0.75],
    [0.3, 0.45, 0.9],
    [-0.16, 0.6, 0.18]
  ] as const;

  let cubeEl: HTMLDivElement | null = null;
  let rollTimer: ReturnType<typeof setTimeout> | null = null;

  function faceVector(n: number): FaceVector {
    const idx: number = Math.max(1, Math.min(6, n)) - 1;
    return perFace[idx];
  }

  function setTransformForValue(n: number): void {
    const [x, y, z] = faceVector(n);
    if (cubeEl) {
      cubeEl.style.transform = `rotate3d(${x}, ${y}, ${z}, 180deg)`;
    }
  }

  function clearTimers(): void {
    if (rollTimer) {
      clearTimeout(rollTimer);
      rollTimer = null;
    }
  }

  function roll(): void {
    if (!canRoll || isRolling) return;
    isRolling = true;
    dispatch('rollStart');
    // Enter rolling state (CSS animation)
    // After delay, settle on a final face
    const finalValue: number = Math.floor(Math.random() * 6) + 1;
    clearTimers();
    rollTimer = setTimeout(() => {
      isRolling = false;
      value = finalValue;
      setTransformForValue(finalValue);
      dispatch('rollComplete', { value: finalValue });
    }, 900);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      roll();
    }
  }

  $: if (!isRolling && cubeEl) {
    setTransformForValue(value);
  }

  $: colorClass = playerColor ? `dice-${playerColor}` : 'dice-default';
</script>

<div class="dice3d-container">
  <div class="diceWrap" on:click={roll} on:keydown={handleKeydown} tabindex={canRoll ? 0 : -1} role="button" aria-label={`Roll dice (current value: ${value})`}>
    <div
      bind:this={cubeEl}
      class="dice {colorClass} {isRolling ? 'rolling' : ''} {canRoll ? '' : 'disabled'}"
    >
      <div class="diceFace front"></div>
      <div class="diceFace up"></div>
      <div class="diceFace left"></div>
      <div class="diceFace right"></div>
      <div class="diceFace bottom"></div>
      <div class="diceFace back"></div>
    </div>
  </div>
  <div class="dice3d-value">
    <span>{value}</span>
  </div>
</div>

<style>
  .dice3d-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .dice3d-value span { font: 700 1.25rem/1 Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }

  .diceWrap {
    position: relative;
    width: 96px;
    height: 96px;
    outline: none;
  }

  .diceWrap::before {
    position: absolute;
    content: "";
    width: 70%;
    height: 10%;
    top: 90%;
    left: 15%;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 100%;
    filter: blur(10px);
  }

  .dice {
    position: absolute;
    width: 80px;
    height: 80px;
    top: 8px;
    left: 8px;
    transform-style: preserve-3d;
    transform: rotate3d(0, 0.9, 0.9, 90deg);
    transition: 0.5s cubic-bezier(0.42, 1.57, 0.62, 0.86);
    cursor: pointer;
    /* Fill any subpixel gaps with the same face color */
    background-color: #ffffff;
  }

  .dice.disabled { cursor: not-allowed; opacity: 0.6; filter: grayscale(0.5); }

  .dice.rolling { animation: rotatePerFace 1s cubic-bezier(0.42, 1.57, 0.62, 0.86) infinite; }

  .diceFace {
    box-sizing: border-box;
    position: absolute;
    width: 80px;
    height: 80px;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: var(--dice-radius, 12px);
    transform-style: preserve-3d;
    transition: 0.5s;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .diceFace::before { display: none; }

  .diceFace::after {
    position: absolute;
    content: "";
    width: 20px;
    height: 20px;
    top: 50%;
    left: 50%;
    margin: -10px 0 0 -10px;
    background-color: var(--pip, #131210);
    border-radius: 100%;
    transform: translateZ(1px);
    box-shadow: none;
  }

  .front { transform: translateZ(40px); }
  .front::after { width: 40px; height: 40px; margin: -20px 0 0 -20px; background-color: var(--pip-strong, var(--pip)); }

  .up { transform: rotateX(90deg) translateZ(40px); }
  .up::after { margin: -30px 0 0 -30px; box-shadow: 40px 40px var(--pip); }

  .left { transform: rotateY(-90deg) translateZ(40px); }
  .left::after { margin: -40px 0 0 -40px; box-shadow: 30px 30px var(--pip), 60px 60px var(--pip); }

  .right { transform: rotateY(90deg) translateZ(40px); }
  .right::after { margin: -30px 0 0 -30px; background-color: var(--pip-strong, var(--pip)); box-shadow: 40px 0 var(--pip-strong, var(--pip)), 0 40px var(--pip-strong, var(--pip)), 40px 40px var(--pip-strong, var(--pip)); }

  .bottom { transform: rotateX(-90deg) translateZ(40px); }
  .bottom::after { margin: -36px 0 0 -36px; box-shadow: 26px 26px var(--pip), 52px 52px var(--pip), 52px 0 var(--pip), 0 52px var(--pip); }

  .back { transform: rotateX(180deg) translateZ(40px); }
  .back::after { margin: -40px 0 0 -30px; box-shadow: 40px 0 var(--pip), 0 30px var(--pip), 40px 30px var(--pip), 0 60px var(--pip), 40px 60px var(--pip); }

  /* Color themes mapped to playerColor (white faces, colored pips, rounded corners) */
  .dice-default { --pip: #131210; --pip-strong: #131210; --dice-radius: 12px; }
  .dice-red { --pip: #ea4330; --pip-strong: #ea4330; --dice-radius: 12px; }
  .dice-blue { --pip: #4285f4; --pip-strong: #4285f4; --dice-radius: 12px; }
  .dice-green { --pip: #34a853; --pip-strong: #34a853; --dice-radius: 12px; }
  .dice-yellow { --pip: #fbbc05; --pip-strong: #fbbc05; --dice-radius: 12px; }

  @keyframes rotatePerFace {
    0% { transform: rotate3d(-0.1, 0.3, -1, 180deg); }
    20% { transform: rotate3d(-0.1, 0.6, -0.4, 180deg); }
    40% { transform: rotate3d(-0.85, -0.42, 0.73, 180deg); }
    60% { transform: rotate3d(-0.8, 0.3, -0.75, 180deg); }
    80% { transform: rotate3d(0.3, 0.45, 0.9, 180deg); }
    100% { transform: rotate3d(-0.16, 0.6, 0.18, 180deg); }
  }

  .diceWrap:focus-visible { outline: 3px solid #4dabf7; outline-offset: 2px; border-radius: 8px; }

  @media (max-width: 768px) {
    .diceWrap { width: 80px; height: 80px; }
    .dice { width: 64px; height: 64px; top: 8px; left: 8px; }
    .diceFace { width: 64px; height: 64px; }
  }
</style>
