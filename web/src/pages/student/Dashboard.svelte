<script>
  import { onMount } from 'svelte';
  import { user } from '../../stores/auth.js';
  import { bookingApi, usersApi, coursesApi } from '../../services/api.js';
  import Calendar from '../../components/Calendar.svelte';
  import TeacherCard from '../../components/TeacherCard.svelte';
  import CourseCard from '../../components/CourseCard.svelte';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { notify } from '../../stores/notifications.js';

  let isLoading = true;
  let bookings = [];
  let recentSessions = [];
  let recommendedTeachers = [];
  let recommendedCourses = [];
  let selectedDate = new Date();

  // 載入數據
  async function loadDashboardData() {
    try {
      isLoading = true;

      // 並行載入所有數據
      const [bookingsRes, teachersRes, coursesRes] = await Promise.all([
        bookingApi.getMyBookings(),
        usersApi.getRecommendedTeachers(4),
        coursesApi.getRecommended(6)
      ]);

      bookings = bookingsRes || [];
      recommendedTeachers = teachersRes || [];
      recommendedCourses = coursesRes || [];

      // 處理最近的課程會議（已完成的課程）
      recentSessions = bookings
        .filter(booking => new Date(booking.end_at) < new Date())
        .sort((a, b) => new Date(b.end_at) - new Date(a.end_at))
        .slice(0, 3);

    } catch (error) {
      console.error('載入主頁數據失敗:', error);
      notify.error('載入數據失敗，請重新整理頁面');
    } finally {
      isLoading = false;
    }
  }

  // 處理日期選擇
  function handleDateSelect(event) {
    selectedDate = event.detail.date;
    // 可以在這裡添加顯示該日期詳細信息的邏輯
  }

  // 處理老師選擇
  function handleTeacherSelect(event) {
    const teacher = event.detail.teacher;
    // 導航到老師詳情頁面
    window.location.href = `/teachers/${teacher.id}`;
  }

  // 處理查看老師日曆
  function handleViewTeacherCalendar(event) {
    const teacher = event.detail.teacher;
    // 導航到老師日曆頁面
    window.location.href = `/teachers/${teacher.id}/calendar`;
  }

  // 處理課程選擇
  function handleCourseSelect(event) {
    const course = event.detail.course;
    // 導航到課程預約頁面
    window.location.href = `/courses/${course.id}/book`;
  }

  // 格式化日期時間
  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 獲取課程狀態
  function getBookingStatus(booking) {
    const now = new Date();
    const startTime = new Date(booking.start_at);
    const endTime = new Date(booking.end_at);

    if (endTime < now) return 'completed';
    if (startTime <= now && endTime >= now) return 'ongoing';
    return 'upcoming';
  }

  // 獲取狀態顯示文字
  function getStatusText(status) {
    const statusMap = {
      'completed': '已完成',
      'ongoing': '進行中',
      'upcoming': '即將開始'
    };
    return statusMap[status] || status;
  }

  // 獲取狀態樣式
  function getStatusClass(status) {
    const classMap = {
      'completed': 'bg-gray-100 text-gray-800',
      'ongoing': 'bg-green-100 text-green-800',
      'upcoming': 'bg-blue-100 text-blue-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  onMount(() => {
    loadDashboardData();
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
{:else}
  <div class="space-y-6">
    <!-- 歡迎橫幅 -->
    <div class="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg text-white p-6">
      <h1 class="text-2xl font-bold">
        歡迎回來，{$user?.name}！
      </h1>
      <p class="mt-2 text-green-100">
        準備好開始今天的學習之旅了嗎？
      </p>
    </div>

    <!-- 當前預約 Table View -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">當前預約</h2>
        <a href="/student/bookings" class="text-sm text-blue-600 hover:text-blue-800">查看全部</a>
      </div>
      <div class="card-body">
        {#if bookings.length === 0}
          <div class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="mt-2">暫無預約課程</p>
            <a href="/student/courses" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              立即預約課程
            </a>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">課程</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">老師</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each bookings.slice(0, 5) as booking}
                  {@const status = getBookingStatus(booking)}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{booking.course?.title || '未知課程'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{booking.teacher?.name || '未知老師'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{formatDateTime(booking.start_at)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusClass(status)}">
                        {getStatusText(status)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {#if status === 'upcoming'}
                        <a href="/sessions/{booking.id}" class="text-blue-600 hover:text-blue-900">進入課程</a>
                      {:else if status === 'ongoing'}
                        <a href="/sessions/{booking.id}" class="text-green-600 hover:text-green-900">正在進行</a>
                      {:else}
                        <span class="text-gray-400">已結束</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <!-- 中間區域：日曆和最近課程反饋 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左半：當月預約日曆 -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-gray-900">本月課程日曆</h2>
        </div>
        <div class="card-body">
          <Calendar
            {bookings}
            on:dateSelect={handleDateSelect}
          />
        </div>
      </div>

      <!-- 右半：最近課程反饋 -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-gray-900">最近課程反饋</h2>
        </div>
        <div class="card-body">
          {#if recentSessions.length === 0}
            <div class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="mt-2">暫無課程反饋</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each recentSessions as session}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h4 class="font-medium text-gray-900">{session.course?.title || '未知課程'}</h4>
                      <p class="text-sm text-gray-500">
                        {session.teacher?.name || '未知老師'} • {formatDateTime(session.end_at)}
                      </p>
                    </div>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已完成
                    </span>
                  </div>

                  <!-- 模擬老師反饋 -->
                  <div class="space-y-3 text-sm">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span class="font-medium text-gray-700">家庭作業:</span>
                        <p class="text-gray-600 mt-1">完成第3章練習題，注意語法結構</p>
                      </div>
                      <div>
                        <span class="font-medium text-gray-700">詞彙:</span>
                        <p class="text-gray-600 mt-1">學習了10個新單詞，需要多練習</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span class="font-medium text-gray-700">語法:</span>
                        <div class="flex items-center mt-1">
                          <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 75%"></div>
                          </div>
                          <span class="ml-2 text-xs text-gray-600">良好</span>
                        </div>
                      </div>
                      <div>
                        <span class="font-medium text-gray-700">發音:</span>
                        <div class="flex items-center mt-1">
                          <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="bg-yellow-500 h-2 rounded-full" style="width: 60%"></div>
                          </div>
                          <span class="ml-2 text-xs text-gray-600">需改進</span>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span class="font-medium text-gray-700">連貫性:</span>
                        <div class="flex items-center mt-1">
                          <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: 80%"></div>
                          </div>
                          <span class="ml-2 text-xs text-gray-600">優秀</span>
                        </div>
                      </div>
                      <div>
                        <span class="font-medium text-gray-700">整體表現:</span>
                        <div class="flex items-center mt-1">
                          <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                          </div>
                          <span class="ml-2 text-xs text-gray-600">優秀</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- 推薦老師 -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">推薦老師</h2>
        <a href="/teachers" class="text-sm text-blue-600 hover:text-blue-800">查看更多</a>
      </div>
      <div class="card-body">
        {#if recommendedTeachers.length === 0}
          <div class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p class="mt-2">暫無推薦老師</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {#each recommendedTeachers as teacher}
              <TeacherCard
                {teacher}
                compact={true}
                on:teacherSelect={handleTeacherSelect}
                on:viewCalendar={handleViewTeacherCalendar}
              />
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- 推薦課程 -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">推薦課程</h2>
        <a href="/student/courses" class="text-sm text-blue-600 hover:text-blue-800">查看更多</a>
      </div>
      <div class="card-body">
        {#if recommendedCourses.length === 0}
          <div class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="mt-2">暫無推薦課程</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each recommendedCourses as course}
              <CourseCard
                {course}
                compact={true}
                on:courseSelect={handleCourseSelect}
              />
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
