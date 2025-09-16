<script>
  import { onMount } from 'svelte';
  import { notify } from '../../stores/notifications.js';
  import api from '../../services/api.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { ROLE_NAMES } from '../../stores/auth.js';
  import { formatDate, getStatusColor, getStatusLabel } from '../../utils/helpers.js';

  let isLoading = true;
  let users = [];
  let filteredUsers = [];
  let searchTerm = '';
  let selectedRole = '';
  let showCreateModal = false;
  let showEditModal = false;
  let editingUser = null;

  // 新用戶表單
  let newUser = {
    name: '',
    email: '',
    password: '',
    role: 'student'
  };

  // 編輯用戶表單
  let editUser = {
    id: '',
    name: '',
    email: '',
    role: '',
    phone: '',
    bio: ''
  };

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    isLoading = true;
    try {
      users = await api.users.getAll();
      filterUsers();
    } catch (error) {
      notify.error('載入用戶列表失敗');
      console.error('Load users error:', error);
    } finally {
      isLoading = false;
    }
  }

  function filterUsers() {
    filteredUsers = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = !selectedRole || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }

  // 監聽搜尋和篩選變化
  $: if (searchTerm !== undefined || selectedRole !== undefined) {
    filterUsers();
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      notify.error('請填寫所有必填欄位');
      return;
    }

    try {
      await api.users.create(newUser);
      notify.success('用戶創建成功');
      showCreateModal = false;
      newUser = { name: '', email: '', password: '', role: 'student' };
      await loadUsers();
    } catch (error) {
      notify.error(error.message || '創建用戶失敗');
    }
  }

  async function deleteUser(userId, userName) {
    if (!confirm(`確定要刪除用戶 "${userName}" 嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      await api.users.delete(userId);
      notify.success('用戶刪除成功');
      await loadUsers();
    } catch (error) {
      notify.error(error.message || '刪除用戶失敗');
    }
  }

  function openEditModal(user) {
    editingUser = user;
    editUser = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      phone: user.phone || '',
      bio: user.bio || ''
    };
    showEditModal = true;
  }

  async function updateUser() {
    if (!editUser.name || !editUser.email) {
      notify.error('請填寫所有必填欄位');
      return;
    }

    try {
      await api.users.update(editUser.id, editUser);
      notify.success('用戶更新成功');
      await loadUsers();
      closeEditModal();
    } catch (error) {
      notify.error(error.message || '更新用戶失敗');
    }
  }

  function closeModal() {
    showCreateModal = false;
    newUser = { name: '', email: '', password: '', role: 'student' };
  }

  function closeEditModal() {
    showEditModal = false;
    editingUser = null;
    editUser = { id: '', name: '', email: '', role: '', phone: '', bio: '' };
  }
</script>

<div class="space-y-6">
  <!-- 頁面標題和操作 -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">用戶管理</h1>
      <p class="mt-1 text-sm text-gray-500">
        管理系統中的所有用戶帳戶
      </p>
    </div>
    <button 
      class="btn btn-primary"
      on:click={() => showCreateModal = true}
    >
      <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      新增用戶
    </button>
  </div>

  <!-- 搜尋和篩選 -->
  <div class="card">
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="label">搜尋用戶</label>
          <input
            type="text"
            class="input"
            placeholder="搜尋姓名或 Email..."
            bind:value={searchTerm}
          />
        </div>
        <div>
          <label class="label">角色篩選</label>
          <select class="input" bind:value={selectedRole}>
            <option value="">所有角色</option>
            <option value="admin">管理員</option>
            <option value="teacher">老師</option>
            <option value="student">學生</option>
          </select>
        </div>
        <div class="flex items-end">
          <button 
            class="btn btn-outline"
            on:click={loadUsers}
            disabled={isLoading}
          >
            {#if isLoading}
              <LoadingSpinner size="sm" />
            {:else}
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            {/if}
            刷新
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 用戶列表 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">
        用戶列表 ({filteredUsers.length})
      </h2>
    </div>
    <div class="card-body p-0">
      {#if isLoading}
        <div class="flex justify-center py-8">
          <LoadingSpinner size="lg" text="載入用戶列表..." />
        </div>
      {:else if filteredUsers.length === 0}
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p class="mt-2">沒有找到符合條件的用戶</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">用戶</th>
                <th class="table-header-cell">角色</th>
                <th class="table-header-cell">註冊時間</th>
                <th class="table-header-cell">狀態</th>
                <th class="table-header-cell">操作</th>
              </tr>
            </thead>
            <tbody class="table-body">
              {#each filteredUsers as user}
                <tr>
                  <td class="table-cell">
                    <div class="flex items-center">
                      <div class="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                        <span class="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{user.name}</div>
                        <div class="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td class="table-cell">
                    <span class="badge badge-{getStatusColor(user.role)}">
                      {ROLE_NAMES[user.role] || user.role}
                    </span>
                  </td>
                  <td class="table-cell">
                    <div class="text-sm text-gray-900">
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td class="table-cell">
                    <span class="badge badge-success">
                      啟用
                    </span>
                  </td>
                  <td class="table-cell">
                    <div class="flex space-x-2">
                      <button
                        class="btn btn-sm btn-outline"
                        title="編輯用戶"
                        on:click={() => openEditModal(user)}
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        class="btn btn-sm btn-danger"
                        title="刪除用戶"
                        on:click={() => deleteUser(user.id, user.name)}
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- 創建用戶模態框 -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-container" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">新增用戶</h3>
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
      
      <form on:submit|preventDefault={createUser} class="p-4 space-y-4">
        <div>
          <label class="label">姓名 *</label>
          <input
            type="text"
            class="input"
            placeholder="請輸入姓名"
            bind:value={newUser.name}
            required
          />
        </div>
        
        <div>
          <label class="label">Email *</label>
          <input
            type="email"
            class="input"
            placeholder="請輸入 Email"
            bind:value={newUser.email}
            required
          />
        </div>
        
        <div>
          <label class="label">密碼 *</label>
          <input
            type="password"
            class="input"
            placeholder="請輸入密碼"
            bind:value={newUser.password}
            required
          />
        </div>
        
        <div>
          <label class="label">角色 *</label>
          <select class="input" bind:value={newUser.role} required>
            <option value="student">學生</option>
            <option value="teacher">老師</option>
            <option value="admin">管理員</option>
          </select>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" class="btn btn-outline" on:click={closeModal}>
            取消
          </button>
          <button type="submit" class="btn btn-primary">
            創建用戶
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- 編輯用戶模態框 -->
{#if showEditModal}
  <div class="modal-overlay" on:click={closeEditModal}>
    <div class="modal-container" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">編輯用戶</h3>
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

      <form on:submit|preventDefault={updateUser} class="p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">姓名 *</label>
            <input
              type="text"
              class="input"
              placeholder="請輸入姓名"
              bind:value={editUser.name}
              required
            />
          </div>

          <div>
            <label class="label">Email *</label>
            <input
              type="email"
              class="input"
              placeholder="請輸入 Email"
              bind:value={editUser.email}
              required
            />
          </div>

          <div>
            <label class="label">角色 *</label>
            <select class="input" bind:value={editUser.role} required>
              <option value="admin">管理員</option>
              <option value="teacher">老師</option>
              <option value="student">學生</option>
            </select>
          </div>

          <div>
            <label class="label">手機號碼</label>
            <input
              type="tel"
              class="input"
              placeholder="請輸入手機號碼"
              bind:value={editUser.phone}
            />
          </div>
        </div>

        <div>
          <label class="label">個人簡介</label>
          <textarea
            class="input"
            rows="3"
            placeholder="請輸入個人簡介"
            bind:value={editUser.bio}
          ></textarea>
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
            更新用戶
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
