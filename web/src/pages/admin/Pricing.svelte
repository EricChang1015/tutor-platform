<script>
  import { onMount } from 'svelte';
  import { notify } from '../../stores/notifications.js';
  import { t, formatCurrency } from '../../stores/i18n.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';

  let isLoading = true;
  let pricingPlans = [];
  let showCreateModal = false;
  let showEditModal = false;
  let editingPlan = null;

  // 新定價方案表單
  let newPlan = {
    name: '',
    description: '',
    price: 0,
    currency: 'TWD',
    duration: 60,
    type: 'per_session',
    features: [],
    isActive: true
  };

  // 編輯定價方案表單
  let editPlan = {
    id: '',
    name: '',
    description: '',
    price: 0,
    currency: 'TWD',
    duration: 60,
    type: 'per_session',
    features: [],
    isActive: true
  };

  let newFeature = '';
  let editFeature = '';

  onMount(async () => {
    await loadPricingPlans();
  });

  async function loadPricingPlans() {
    isLoading = true;
    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模擬數據
      pricingPlans = [
        {
          id: 1,
          name: '基礎課程',
          description: '適合初學者的基礎課程',
          price: 500,
          currency: 'TWD',
          duration: 60,
          type: 'per_session',
          features: ['一對一教學', '課後練習', '學習資料'],
          isActive: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: '進階課程',
          description: '適合有基礎的學生',
          price: 800,
          currency: 'TWD',
          duration: 90,
          type: 'per_session',
          features: ['一對一教學', '課後練習', '學習資料', '作業批改'],
          isActive: true,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: '月度套餐',
          description: '包含 8 堂課的月度套餐',
          price: 3200,
          currency: 'TWD',
          duration: 60,
          type: 'package',
          features: ['8 堂課程', '一對一教學', '課後練習', '學習資料', '優先預約'],
          isActive: true,
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      notify.error('載入定價方案失敗');
      console.error('Load pricing plans error:', error);
    } finally {
      isLoading = false;
    }
  }

  async function createPlan() {
    if (!newPlan.name || !newPlan.price) {
      notify.error('請填寫所有必填欄位');
      return;
    }

    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 500));

      const plan = {
        ...newPlan,
        id: Date.now(),
        created_at: new Date().toISOString()
      };

      pricingPlans = [...pricingPlans, plan];
      notify.success('定價方案創建成功');
      closeModal();
    } catch (error) {
      notify.error(error.message || '創建定價方案失敗');
    }
  }

  async function updatePlan() {
    if (!editPlan.name || !editPlan.price) {
      notify.error('請填寫所有必填欄位');
      return;
    }

    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 500));

      const index = pricingPlans.findIndex(p => p.id === editPlan.id);
      if (index !== -1) {
        pricingPlans[index] = { ...editPlan };
        pricingPlans = [...pricingPlans];
      }

      notify.success('定價方案更新成功');
      closeEditModal();
    } catch (error) {
      notify.error(error.message || '更新定價方案失敗');
    }
  }

  async function deletePlan(planId, planName) {
    if (!confirm(`確定要刪除定價方案 "${planName}" 嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 500));

      pricingPlans = pricingPlans.filter(p => p.id !== planId);
      notify.success('定價方案刪除成功');
    } catch (error) {
      notify.error(error.message || '刪除定價方案失敗');
    }
  }

  function openEditModal(plan) {
    editingPlan = plan;
    editPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
      type: plan.type,
      features: [...plan.features],
      isActive: plan.isActive
    };
    showEditModal = true;
  }

  function addFeature(isEdit = false) {
    const feature = isEdit ? editFeature : newFeature;
    if (!feature.trim()) return;

    if (isEdit) {
      editPlan.features = [...editPlan.features, feature.trim()];
      editFeature = '';
    } else {
      newPlan.features = [...newPlan.features, feature.trim()];
      newFeature = '';
    }
  }

  function removeFeature(index, isEdit = false) {
    if (isEdit) {
      editPlan.features = editPlan.features.filter((_, i) => i !== index);
    } else {
      newPlan.features = newPlan.features.filter((_, i) => i !== index);
    }
  }

  function closeModal() {
    showCreateModal = false;
    newPlan = {
      name: '',
      description: '',
      price: 0,
      currency: 'TWD',
      duration: 60,
      type: 'per_session',
      features: [],
      isActive: true
    };
    newFeature = '';
  }

  function closeEditModal() {
    showEditModal = false;
    editingPlan = null;
    editPlan = {
      id: '',
      name: '',
      description: '',
      price: 0,
      currency: 'TWD',
      duration: 60,
      type: 'per_session',
      features: [],
      isActive: true
    };
    editFeature = '';
  }

  function getTypeLabel(type) {
    switch (type) {
      case 'per_session': return '單堂課程';
      case 'package': return '課程包';
      case 'subscription': return '訂閱制';
      default: return type;
    }
  }
</script>

<div class="space-y-6">
  <!-- 頁面標題和操作 -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{$t('features.pricingManagement')}</h1>
      <p class="mt-1 text-sm text-gray-500">
        管理課程定價和折扣策略
      </p>
    </div>
    <button
      class="btn btn-primary"
      on:click={() => showCreateModal = true}
    >
      <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      新增定價方案
    </button>
  </div>

  <!-- 定價方案列表 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">定價方案</h2>
    </div>
    <div class="card-body">
      {#if isLoading}
        <div class="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      {:else if pricingPlans.length === 0}
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">沒有定價方案</h3>
          <p class="mt-1 text-sm text-gray-500">開始創建您的第一個定價方案</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each pricingPlans as plan}
            <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">{plan.name}</h3>
                <div class="flex space-x-2">
                  <button
                    class="btn btn-sm btn-outline"
                    title="編輯方案"
                    on:click={() => openEditModal(plan)}
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    title="刪除方案"
                    on:click={() => deletePlan(plan.id, plan.name)}
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <div class="flex items-baseline">
                  <span class="text-3xl font-bold text-gray-900">
                    {$formatCurrency(plan.price, plan.currency)}
                  </span>
                  <span class="ml-2 text-sm text-gray-500">
                    / {plan.duration} 分鐘
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{plan.description}</p>
              </div>

              <div class="mb-4">
                <span class="badge badge-{plan.type === 'package' ? 'primary' : 'secondary'}">
                  {getTypeLabel(plan.type)}
                </span>
                <span class="badge badge-{plan.isActive ? 'success' : 'secondary'} ml-2">
                  {plan.isActive ? '啟用' : '停用'}
                </span>
              </div>

              {#if plan.features.length > 0}
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">包含功能：</h4>
                  <ul class="text-sm text-gray-600 space-y-1">
                    {#each plan.features as feature}
                      <li class="flex items-center">
                        <svg class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- 創建定價方案模態框 -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-container max-w-2xl" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">新增定價方案</h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-500"
          on:click={closeModal}
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={createPlan} class="p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">方案名稱 *</label>
            <input
              type="text"
              class="input"
              placeholder="請輸入方案名稱"
              bind:value={newPlan.name}
              required
            />
          </div>

          <div>
            <label class="label">方案類型 *</label>
            <select class="input" bind:value={newPlan.type} required>
              <option value="per_session">單堂課程</option>
              <option value="package">課程包</option>
              <option value="subscription">訂閱制</option>
            </select>
          </div>

          <div>
            <label class="label">價格 *</label>
            <input
              type="number"
              class="input"
              placeholder="0"
              bind:value={newPlan.price}
              min="0"
              required
            />
          </div>

          <div>
            <label class="label">時長（分鐘）</label>
            <input
              type="number"
              class="input"
              placeholder="60"
              bind:value={newPlan.duration}
              min="1"
            />
          </div>
        </div>

        <div>
          <label class="label">方案描述</label>
          <textarea
            class="input"
            rows="3"
            placeholder="請輸入方案描述"
            bind:value={newPlan.description}
          ></textarea>
        </div>

        <div>
          <label class="label">包含功能</label>
          <div class="flex space-x-2 mb-2">
            <input
              type="text"
              class="input flex-1"
              placeholder="輸入功能描述"
              bind:value={newFeature}
              on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button
              type="button"
              class="btn btn-outline"
              on:click={() => addFeature()}
            >
              添加
            </button>
          </div>
          {#if newPlan.features.length > 0}
            <div class="space-y-2">
              {#each newPlan.features as feature, index}
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span class="text-sm">{feature}</span>
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700"
                    on:click={() => removeFeature(index)}
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="newPlanActive"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            bind:checked={newPlan.isActive}
          />
          <label for="newPlanActive" class="ml-2 text-sm text-gray-900">
            啟用此方案
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            class="btn btn-outline"
            on:click={closeModal}
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            創建方案
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- 編輯定價方案模態框 -->
{#if showEditModal}
  <div class="modal-overlay" on:click={closeEditModal}>
    <div class="modal-container max-w-2xl" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">編輯定價方案</h3>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-500"
          on:click={closeEditModal}
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={updatePlan} class="p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">方案名稱 *</label>
            <input
              type="text"
              class="input"
              placeholder="請輸入方案名稱"
              bind:value={editPlan.name}
              required
            />
          </div>

          <div>
            <label class="label">方案類型 *</label>
            <select class="input" bind:value={editPlan.type} required>
              <option value="per_session">單堂課程</option>
              <option value="package">課程包</option>
              <option value="subscription">訂閱制</option>
            </select>
          </div>

          <div>
            <label class="label">價格 *</label>
            <input
              type="number"
              class="input"
              placeholder="0"
              bind:value={editPlan.price}
              min="0"
              required
            />
          </div>

          <div>
            <label class="label">時長（分鐘）</label>
            <input
              type="number"
              class="input"
              placeholder="60"
              bind:value={editPlan.duration}
              min="1"
            />
          </div>
        </div>

        <div>
          <label class="label">方案描述</label>
          <textarea
            class="input"
            rows="3"
            placeholder="請輸入方案描述"
            bind:value={editPlan.description}
          ></textarea>
        </div>

        <div>
          <label class="label">包含功能</label>
          <div class="flex space-x-2 mb-2">
            <input
              type="text"
              class="input flex-1"
              placeholder="輸入功能描述"
              bind:value={editFeature}
              on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature(true))}
            />
            <button
              type="button"
              class="btn btn-outline"
              on:click={() => addFeature(true)}
            >
              添加
            </button>
          </div>
          {#if editPlan.features.length > 0}
            <div class="space-y-2">
              {#each editPlan.features as feature, index}
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span class="text-sm">{feature}</span>
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700"
                    on:click={() => removeFeature(index, true)}
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="editPlanActive"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            bind:checked={editPlan.isActive}
          />
          <label for="editPlanActive" class="ml-2 text-sm text-gray-900">
            啟用此方案
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            class="btn btn-outline"
            on:click={closeEditModal}
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            更新方案
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
