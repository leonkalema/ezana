<script lang="ts">
  import { walletStore, walletService, type Transaction, type WithdrawalRequest } from '$lib/stores/wallet.js';
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let isVisible = false;
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  let depositAmount = 10;
  let withdrawAmount = 10000;
  let paypalEmail = '';
  let activeTab: 'balance' | 'withdraw' | 'transactions' = 'balance';
  let withdrawSuccess = false;
  
  $: if (isVisible && activeTab === 'transactions') {
    walletService.fetchTransactions(20);
  }
  
  $: if (isVisible && activeTab === 'withdraw') {
    walletService.fetchWithdrawalConfig();
    walletService.fetchWithdrawals();
  }
  
  $: minWithdraw = $walletStore.withdrawalConfig?.minTokens ?? 10000;
  $: tokensPerUsd = $walletStore.withdrawalConfig?.tokensPerUsd ?? 1000;
  $: withdrawUsd = withdrawAmount / tokensPerUsd;
  $: canWithdraw = withdrawAmount >= minWithdraw && withdrawAmount <= $walletStore.balance && paypalEmail.includes('@');
  $: hasPendingWithdrawal = $walletStore.withdrawals.some(w => w.status === 'pending' || w.status === 'processing');
  
  onMount(() => {
    walletService.fetchWithdrawalConfig();
    walletService.fetchDepositConfig();
  });
  
  $: depositConfig = $walletStore.depositConfig;
  $: depositTokens = depositAmount * (depositConfig?.tokensPerUsd ?? 1000);
  $: canDeposit = depositAmount >= (depositConfig?.minUsd ?? 1) && depositAmount <= (depositConfig?.maxUsd ?? 1000);
  
  async function startPayPalDeposit() {
    const result = await walletService.createDepositOrder(depositAmount);
    if (result.success && result.approvalUrl) {
      window.location.href = result.approvalUrl;
    }
  }
  
  async function deposit() {
    try {
      await walletService.deposit(depositAmount);
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  }
  
  async function requestWithdrawal() {
    withdrawSuccess = false;
    const result = await walletService.requestWithdrawal(withdrawAmount, paypalEmail);
    if (result.success) {
      withdrawSuccess = true;
      withdrawAmount = minWithdraw;
      paypalEmail = '';
    }
  }
  
  async function cancelWithdrawal(id: number) {
    await walletService.cancelWithdrawal(id);
  }
  
  function close() {
    isVisible = false;
    withdrawSuccess = false;
    dispatch('close');
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getTransactionIcon(transaction: Transaction): string {
    switch (transaction.kind) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'stake_hold': return '🔒';
      case 'stake_payout': return '🏆';
      case 'stake_refund': return '↩️';
      default: return '💳';
    }
  }
  
  function getTransactionDescription(transaction: Transaction): string {
    switch (transaction.kind) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'stake_hold': return 'Stake Hold';
      case 'stake_payout': return 'Game Winnings';
      case 'stake_refund': return 'Stake Refund';
      default: return transaction.kind;
    }
  }
  
  function getWithdrawalStatusColor(status: WithdrawalRequest['status']): string {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
</script>

{#if isVisible}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-2xl font-bold text-gray-800">Wallet</h2>
        <button 
          on:click={close}
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>
      
      <!-- Tabs -->
      <div class="flex border-b">
        <button
          class="flex-1 px-4 py-3 font-medium text-sm {activeTab === 'balance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'balance'}
        >
          Balance
        </button>
        <button
          class="flex-1 px-4 py-3 font-medium text-sm {activeTab === 'withdraw' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'withdraw'}
        >
          Withdraw
        </button>
        <button
          class="flex-1 px-4 py-3 font-medium text-sm {activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'transactions'}
        >
          History
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        {#if activeTab === 'balance'}
          <!-- Balance Tab -->
          <div class="space-y-6">
            <!-- Current Balance -->
            <div class="text-center p-6 bg-[#E9E8E3] rounded-xl">
              <div class="text-sm text-[#2D2D2D]/70 mb-2">Current Balance</div>
              <div class="text-4xl font-bold text-[#6B8E7E] mb-2">
                {$walletStore.balance.toLocaleString()}
              </div>
              <div class="text-sm text-gray-500">tokens</div>
            </div>
            
            <!-- PayPal Deposit -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800">Add Tokens via PayPal</h3>
              
              <div>
                <label for="deposit-amount" class="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <button 
                    class="p-2 border-2 rounded-lg text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors {depositAmount === 5 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                    on:click={() => depositAmount = 5}
                  >
                    $5
                  </button>
                  <button 
                    class="p-2 border-2 rounded-lg text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors {depositAmount === 10 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                    on:click={() => depositAmount = 10}
                  >
                    $10
                  </button>
                  <button 
                    class="p-2 border-2 rounded-lg text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors {depositAmount === 25 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                    on:click={() => depositAmount = 25}
                  >
                    $25
                  </button>
                </div>
                <div class="flex space-x-2">
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      id="deposit-amount"
                      type="number" 
                      bind:value={depositAmount} 
                      min={depositConfig?.minUsd ?? 1}
                      max={depositConfig?.maxUsd ?? 1000}
                      class="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Amount"
                    />
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-blue-50 rounded-lg">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">You will receive:</span>
                  <span class="text-xl font-bold text-blue-600">{depositTokens.toLocaleString()} tokens</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Rate: $1 USD = {depositConfig?.tokensPerUsd?.toLocaleString() ?? '1,000'} tokens</p>
              </div>
              
              {#if depositConfig?.clientId}
                <button 
                  class="w-full px-6 py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  on:click={startPayPalDeposit}
                  disabled={!canDeposit || $walletStore.loading}
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.724c2.332 0 4.032.636 5.054 1.889.964 1.183 1.273 2.818.918 4.862-.018.105-.039.21-.063.316a7.087 7.087 0 0 1-.206.773c-.028.09-.058.18-.09.27-.032.09-.066.18-.102.27-.036.09-.074.18-.114.27-.04.09-.082.18-.126.27-.044.09-.09.18-.138.27-.048.09-.098.18-.15.27-.052.09-.106.18-.162.27-.056.09-.114.18-.174.27-.06.09-.122.18-.186.27-.064.09-.13.18-.198.27-.068.09-.138.18-.21.27-.072.09-.146.18-.222.27-.076.09-.154.18-.234.27-.08.09-.162.18-.246.27-.084.09-.17.18-.258.27-.088.09-.178.18-.27.27-.092.09-.186.18-.282.27-.096.09-.194.18-.294.27-.1.09-.202.18-.306.27-.104.09-.21.18-.318.27-.108.09-.218.18-.33.27-.112.09-.226.18-.342.27-.116.09-.234.18-.354.27-.118.09-.238.18-.36.27-.122.09-.246.18-.372.27-.126.09-.254.18-.384.27-.128.09-.258.18-.39.27-.132.09-.266.18-.402.27-.136.09-.274.18-.414.27-.138.09-.278.18-.42.27-.142.09-.286.18-.432.27-.146.09-.294.18-.444.27-.148.09-.298.18-.45.27-.152.09-.306.18-.462.27-.156.09-.314.18-.474.27-.158.09-.318.18-.48.27-.162.09-.326.18-.492.27-.166.09-.334.18-.504.27-.168.09-.338.18-.51.27-.172.09-.346.18-.522.27-.176.09-.354.18-.534.27-.178.09-.358.18-.54.27-.182.09-.366.18-.552.27-.184.09-.37.18-.558.27-.188.09-.378.18-.57.27-.19.09-.382.18-.576.27-.194.09-.39.18-.588.27-.196.09-.394.18-.594.27-.2.09-.402.18-.606.27-.202.09-.406.18-.612.27-.206.09-.414.18-.624.27-.208.09-.418.18-.63.27-.212.09-.426.18-.642.27-.214.09-.43.18-.648.27-.218.09-.438.18-.66.27-.22.09-.442.18-.666.27-.224.09-.45.18-.678.27-.226.09-.454.18-.684.27-.23.09-.462.18-.696.27-.232.09-.466.18-.702.27-.236.09-.474.18-.714.27-.238.09-.478.18-.72.27-.242.09-.486.18-.732.27-.244.09-.49.18-.738.27-.248.09-.498.18-.75.27-.25.09-.502.18-.756.27-.254.09-.51.18-.768.27-.256.09-.514.18-.774.27-.26.09-.522.18-.786.27-.262.09-.526.18-.792.27-.266.09-.534.18-.804.27-.268.09-.538.18-.81.27-.272.09-.546.18-.822.27-.274.09-.55.18-.828.27-.278.09-.558.18-.84.27-.28.09-.562.18-.846.27-.284.09-.57.18-.858.27-.286.09-.574.18-.864.27-.29.09-.582.18-.876.27-.292.09-.586.18-.882.27-.296.09-.594.18-.894.27-.298.09-.598.18-.9.27-.302.09-.606.18-.912.27-.304.09-.61.18-.918.27-.308.09-.618.18-.93.27-.31.09-.622.18-.936.27-.314.09-.63.18-.948.27-.316.09-.634.18-.954.27-.32.09-.642.18-.966.27-.322.09-.646.18-.972.27-.326.09-.654.18-.984.27-.328.09-.658.18-.99.27-.332.09-.666.18-1.002.27-.334.09-.67.18-1.008.27-.338.09-.678.18-1.02.27-.34.09-.682.18-1.026.27-.344.09-.69.18-1.038.27-.346.09-.694.18-1.044.27-.35.09-.702.18-1.056.27-.352.09-.706.18-1.062.27-.356.09-.714.18-1.074.27-.358.09-.718.18-1.08.27-.362.09-.726.18-1.092.27-.364.09-.73.18-1.098.27-.368.09-.738.18-1.11.27-.37.09-.742.18-1.116.27-.374.09-.75.18-1.128.27-.376.09-.754.18-1.134.27-.38.09-.762.18-1.146.27-.382.09-.766.18-1.152.27-.386.09-.774.18-1.164.27-.388.09-.778.18-1.17.27-.392.09-.786.18-1.182.27-.394.09-.79.18-1.188.27-.398.09-.798.18-1.2.27-.4.09-.802.18-1.206.27-.404.09-.81.18-1.218.27-.406.09-.814.18-1.224.27-.41.09-.822.18-1.236.27-.412.09-.826.18-1.242.27-.416.09-.834.18-1.254.27-.418.09-.838.18-1.26.27-.422.09-.846.18-1.272.27-.424.09-.85.18-1.278.27-.428.09-.858.18-1.29.27-.43.09-.862.18-1.296.27-.434.09-.87.18-1.308.27-.436.09-.874.18-1.314.27-.44.09-.882.18-1.326.27-.442.09-.886.18-1.332.27-.446.09-.894.18-1.344.27-.448.09-.898.18-1.35.27-.452.09-.906.18-1.362.27-.454.09-.91.18-1.368.27-.458.09-.918.18-1.38.27-.46.09-.922.18-1.386.27-.464.09-.93.18-1.398.27-.466.09-.934.18-1.404.27-.47.09-.942.18-1.416.27-.472.09-.946.18-1.422.27-.476.09-.954.18-1.434.27-.478.09-.958.18-1.44.27-.482.09-.966.18-1.452.27-.484.09-.97.18-1.458.27-.488.09-.978.18-1.47.27-.49.09-.982.18-1.476.27-.494.09-.99.18-1.488.27-.496.09-.994.18-1.494.27-.5.09-1.002.18-1.506.27-.502.09-1.006.18-1.512.27-.506.09-1.014.18-1.524.27-.508.09-1.018.18-1.53.27-.512.09-1.026.18-1.542.27-.514.09-1.03.18-1.548.27-.518.09-1.038.18-1.56.27-.52.09-1.042.18-1.566.27-.524.09-1.05.18-1.578.27-.526.09-1.054.18-1.584.27-.53.09-1.062.18-1.596.27-.532.09-1.066.18-1.602.27-.536.09-1.074.18-1.614.27-.538.09-1.078.18-1.62.27-.542.09-1.086.18-1.632.27-.544.09-1.09.18-1.638.27-.548.09-1.098.18-1.65.27-.55.09-1.102.18-1.656.27-.554.09-1.11.18-1.668.27-.556.09-1.114.18-1.674.27-.56.09-1.122.18-1.686.27-.562.09-1.126.18-1.692.27-.566.09-1.134.18-1.704.27-.568.09-1.138.18-1.71.27-.572.09-1.146.18-1.722.27-.574.09-1.15.18-1.728.27-.578.09-1.158.18-1.74.27-.58.09-1.162.18-1.746.27-.584.09-1.17.18-1.758.27-.586.09-1.174.18-1.764.27-.59.09-1.182.18-1.776.27-.592.09-1.186.18-1.782.27-.596.09-1.194.18-1.794.27-.598.09-1.198.18-1.8.27-.602.09-1.206.18-1.812.27-.604.09-1.21.18-1.818.27-.608.09-1.218.18-1.83.27-.61.09-1.222.18-1.836.27-.614.09-1.23.18-1.848.27-.616.09-1.234.18-1.854.27-.62.09-1.242.18-1.866.27-.622.09-1.246.18-1.872.27-.626.09-1.254.18-1.884.27-.628.09-1.258.18-1.89.27-.632.09-1.266.18-1.902.27-.634.09-1.27.18-1.908.27-.638.09-1.278.18-1.92.27-.64.09-1.282.18-1.926.27-.644.09-1.29.18-1.938.27-.646.09-1.294.18-1.944.27-.65.09-1.302.18-1.956.27-.652.09-1.306.18-1.962.27-.656.09-1.314.18-1.974.27-.658.09-1.318.18-1.98.27-.662.09-1.326.18-1.992.27-.664.09-1.33.18-1.998.27-.668.09-1.338.18-2.01.27-.67.09-1.342.18-2.016.27-.674.09-1.35.18-2.028.27-.676.09-1.354.18-2.034.27-.68.09-1.362.18-2.046.27-.682.09-1.366.18-2.052.27-.686.09-1.374.18-2.064.27-.688.09-1.378.18-2.07.27-.692.09-1.386.18-2.082.27-.694.09-1.39.18-2.088.27-.698.09-1.398.18-2.1.27-.7.09-1.402.18-2.106.27-.704.09-1.41.18-2.118.27-.706.09-1.414.18-2.124.27-.71.09-1.422.18-2.136.27-.712.09-1.426.18-2.142.27-.716.09-1.434.18-2.154.27-.718.09-1.438.18-2.16.27-.722.09-1.446.18-2.172.27-.724.09-1.45.18-2.178.27-.728.09-1.458.18-2.19.27-.73.09-1.462.18-2.196.27-.734.09-1.47.18-2.208.27-.736.09-1.474.18-2.214.27-.74.09-1.482.18-2.226.27-.742.09-1.486.18-2.232.27-.746.09-1.494.18-2.244.27-.748.09-1.498.18-2.25.27-.752.09-1.506.18-2.262.27-.754.09-1.51.18-2.268.27-.758.09-1.518.18-2.28.27-.76.09-1.522.18-2.286.27-.764.09-1.53.18-2.298.27-.766.09-1.534.18-2.304.27-.77.09-1.542.18-2.316.27-.772.09-1.546.18-2.322.27-.776.09-1.554.18-2.334.27-.778.09-1.558.18-2.34.27-.782.09-1.566.18-2.352.27-.784.09-1.57.18-2.358.27-.788.09-1.578.18-2.37.27-.79.09-1.582.18-2.376.27-.794.09-1.59.18-2.388.27-.796.09-1.594.18-2.394.27-.8.09-1.602.18-2.406.27-.802.09-1.606.18-2.412.27-.806.09-1.614.18-2.424.27-.808.09-1.618.18-2.43.27-.812.09-1.626.18-2.442.27-.814.09-1.63.18-2.448.27-.818.09-1.638.18-2.46.27-.82.09-1.642.18-2.466.27-.824.09-1.65.18-2.478.27-.826.09-1.654.18-2.484.27-.83.09-1.662.18-2.496.27-.832.09-1.666.18-2.502.27-.836.09-1.674.18-2.514.27-.838.09-1.678.18-2.52.27-.842.09-1.686.18-2.532.27-.844.09-1.69.18-2.538.27-.848.09-1.698.18-2.55.27-.85.09-1.702.18-2.556.27-.854.09-1.71.18-2.568.27-.856.09-1.714.18-2.574.27-.86.09-1.722.18-2.586.27-.862.09-1.726.18-2.592.27-.866.09-1.734.18-2.604.27-.868.09-1.738.18-2.61.27-.872.09-1.746.18-2.622.27-.874.09-1.75.18-2.628.27-.878.09-1.758.18-2.64.27-.88.09-1.762.18-2.646.27-.884.09-1.77.18-2.658.27-.886.09-1.774.18-2.664.27-.89.09-1.782.18-2.676.27-.892.09-1.786.18-2.682.27-.896.09-1.794.18-2.694.27-.898.09-1.798.18-2.7.27-.902.09-1.806.18-2.712.27-.904.09-1.81.18-2.718.27-.908.09-1.818.18-2.73.27-.91.09-1.822.18-2.736.27-.914.09-1.83.18-2.748.27-.916.09-1.834.18-2.754.27-.92.09-1.842.18-2.766.27-.922.09-1.846.18-2.772.27-.926.09-1.854.18-2.784.27-.928.09-1.858.18-2.79.27-.932.09-1.866.18-2.802.27-.934.09-1.87.18-2.808.27-.938.09-1.878.18-2.82.27-.94.09-1.882.18-2.826.27-.944.09-1.89.18-2.838.27-.946.09-1.894.18-2.844.27-.95.09-1.902.18-2.856.27-.952.09-1.906.18-2.862.27-.956.09-1.914.18-2.874.27-.958.09-1.918.18-2.88.27-.962.09-1.926.18-2.892.27-.964.09-1.93.18-2.898.27-.968.09-1.938.18-2.91.27-.97.09-1.942.18-2.916.27-.974.09-1.95.18-2.928.27-.976.09-1.954.18-2.934.27-.98.09-1.962.18-2.946.27-.982.09-1.966.18-2.952.27-.986.09-1.974.18-2.964.27-.988.09-1.978.18-2.97.27-.992.09-1.986.18-2.982.27-.994.09-1.99.18-2.988.27-.998.09-1.998.18-3 .27-1 .09-2.002.18-3.006.27z"/>
                  </svg>
                  {$walletStore.loading ? 'Processing...' : 'Pay with PayPal'}
                </button>
              {:else}
                <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                  <div class="font-semibold">PayPal Not Configured</div>
                  <p class="mt-1">Payment processing is not available. Please contact support.</p>
                </div>
              {/if}
            </div>
          </div>
          
        {:else if activeTab === 'withdraw'}
          <!-- Withdraw Tab -->
          <div class="space-y-6">
            <!-- Current Balance -->
            <div class="text-center p-4 bg-[#E9E8E3] rounded-xl">
              <div class="text-sm text-[#2D2D2D]/70 mb-1">Available Balance</div>
              <div class="text-3xl font-bold text-[#6B8E7E]">
                {$walletStore.balance.toLocaleString()} <span class="text-lg font-normal">tokens</span>
              </div>
            </div>
            
            {#if withdrawSuccess}
              <div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <div class="font-semibold">Withdrawal Request Submitted!</div>
                <p class="text-sm mt-1">Your funds will be sent to your PayPal account within 24-48 hours.</p>
              </div>
            {/if}
            
            {#if hasPendingWithdrawal}
              <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                <div class="font-semibold">Pending Withdrawal</div>
                <p class="text-sm mt-1">You have a withdrawal in progress. Please wait for it to complete before requesting another.</p>
              </div>
            {:else}
              <!-- Withdrawal Form -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-800">Withdraw to PayPal</h3>
                
                <div>
                  <label for="paypal-email" class="block text-sm font-medium text-gray-700 mb-2">PayPal Email</label>
                  <input 
                    id="paypal-email"
                    type="email" 
                    bind:value={paypalEmail}
                    placeholder="your-email@paypal.com"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="withdraw-amount" class="block text-sm font-medium text-gray-700 mb-2">Amount (tokens)</label>
                  <div class="grid grid-cols-3 gap-2 mb-3">
                    <button 
                      class="p-2 border-2 rounded-lg text-sm hover:border-green-500 hover:bg-green-50 transition-colors {withdrawAmount === 10000 ? 'border-green-500 bg-green-50' : 'border-gray-200'}"
                      on:click={() => withdrawAmount = 10000}
                    >
                      10,000
                    </button>
                    <button 
                      class="p-2 border-2 rounded-lg text-sm hover:border-green-500 hover:bg-green-50 transition-colors {withdrawAmount === 25000 ? 'border-green-500 bg-green-50' : 'border-gray-200'}"
                      on:click={() => withdrawAmount = 25000}
                    >
                      25,000
                    </button>
                    <button 
                      class="p-2 border-2 rounded-lg text-sm hover:border-green-500 hover:bg-green-50 transition-colors {withdrawAmount === 50000 ? 'border-green-500 bg-green-50' : 'border-gray-200'}"
                      on:click={() => withdrawAmount = 50000}
                    >
                      50,000
                    </button>
                  </div>
                  <input 
                    id="withdraw-amount"
                    type="number" 
                    bind:value={withdrawAmount}
                    min={minWithdraw}
                    max={$walletStore.balance}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">Minimum: {minWithdraw.toLocaleString()} tokens</p>
                </div>
                
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">You will receive:</span>
                    <span class="text-xl font-bold text-green-600">${withdrawUsd.toFixed(2)} USD</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Rate: {tokensPerUsd.toLocaleString()} tokens = $1 USD</p>
                </div>
                
                <button 
                  class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  on:click={requestWithdrawal}
                  disabled={!canWithdraw || $walletStore.loading}
                >
                  {$walletStore.loading ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </div>
            {/if}
            
            <!-- Withdrawal History -->
            {#if $walletStore.withdrawals.length > 0}
              <div class="space-y-3 mt-6">
                <h4 class="text-sm font-semibold text-gray-600">Recent Withdrawals</h4>
                {#each $walletStore.withdrawals.slice(0, 5) as withdrawal}
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div class="font-medium">{withdrawal.amount_tokens.toLocaleString()} tokens</div>
                      <div class="text-xs text-gray-500">{formatDate(withdrawal.created_at)}</div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-1 text-xs font-medium rounded-full {getWithdrawalStatusColor(withdrawal.status)}">
                        {withdrawal.status}
                      </span>
                      {#if withdrawal.status === 'pending'}
                        <button 
                          class="text-xs text-red-600 hover:text-red-800"
                          on:click={() => cancelWithdrawal(withdrawal.id)}
                        >
                          Cancel
                        </button>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          
        {:else if activeTab === 'transactions'}
          <!-- Transactions Tab -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            
            {#if $walletStore.transactions.length === 0}
              <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-4">📋</div>
                <p>No transactions yet</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each $walletStore.transactions as transaction}
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <span class="text-2xl">{getTransactionIcon(transaction)}</span>
                      <div>
                        <div class="font-medium text-gray-800">
                          {getTransactionDescription(transaction)}
                        </div>
                        <div class="text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                          {#if transaction.reference}
                            • {transaction.reference}
                          {/if}
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-semibold {transaction.direction === 'credit' ? 'text-green-600' : 'text-red-600'}">
                        {transaction.direction === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                      </div>
                      <div class="text-sm text-gray-500">tokens</div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        
        {#if $walletStore.error}
          <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {$walletStore.error}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
