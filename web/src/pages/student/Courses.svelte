<script>
  import { onMount } from 'svelte';
  import { coursesApi, usersApi, availabilityApi, bookingApi } from '../../services/api.js';
  import CourseCard from '../../components/CourseCard.svelte';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { notify } from '../../stores/notifications.js';

  let isLoading = true;
  let courses = [];
  let selectedCourse = null;
  let recommendedTeachers = [];
  let showBookingModal = false;
  let selectedTeacher = null;
  let selectedDate = '';
  let availableSlots = [];
  let isLoadingSlots = false;

  // 載入課程數據
  async function loadCourses() {
    try {
      isLoading = true;
      const coursesData = await coursesApi.getAll();
      courses = coursesData || [];
    } catch (error) {
      console.error('載入課程失敗:', error);
      notify.error('載入課程失敗，請重新整理頁面');
    } finally {
      isLoading = false;
    }
  }

  // 處理課程選擇
  async function handleCourseSelect(event) {
    const course = event.detail.course;
    selectedCourse = course;

    try {
      // 載入推薦老師
      const teachers = await usersApi.getRecommendedTeachers(4);
      recommendedTeachers = teachers || [];
      showBookingModal = true;
    } catch (error) {
      console.error('載入推薦老師失敗:', error);
      notify.error('載入老師信息失敗');
    }
  }

  // 處理老師選擇
  async function handleTeacherSelect(teacher) {
    selectedTeacher = teacher;

    // 設置默認日期為今天
    const today = new Date();
    selectedDate = today.toISOString().split('T')[0];

    // 載入可用時段
    await loadAvailableSlots();
  }

  // 載入可用時段
  async function loadAvailableSlots() {
    if (!selectedTeacher || !selectedDate) return;

    try {
      isLoadingSlots = true;
      const slots = await availabilityApi.getByTeacher(selectedTeacher.id);

      // 根據選擇的日期和課程時長過濾時段
      const selectedDateObj = new Date(selectedDate);
      const weekday = selectedDateObj.getDay();

      // 過濾出對應星期的時段
      const daySlots = slots.filter(slot => slot.weekday === weekday);

      // 根據課程時長生成可預約時段
      availableSlots = generateBookableSlots(daySlots, selectedCourse.duration_min);

    } catch (error) {
      console.error('載入可用時段失敗:', error);
      notify.error('載入時段失敗');
    } finally {
      isLoadingSlots = false;
    }
  }

  // 根據課程時長生成可預約時段
  function generateBookableSlots(daySlots, durationMin) {
    const bookableSlots = [];

    daySlots.forEach(slot => {
      const startTime = slot.start_time;
      const endTime = slot.end_time;

      // 將時間字符串轉換為分鐘數
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      // 根據課程時長生成時段
      if (durationMin === 25) {
        // 25分鐘課程：00:00-00:25, 00:30-00:55
        for (let time = startMinutes; time + 25 <= endMinutes; time += 30) {
          bookableSlots.push({
            start: minutesToTime(time),
            end: minutesToTime(time + 25),
            available: true
          });
        }
      } else if (durationMin === 50) {
        // 50分鐘課程：00:00-00:50, 01:00-01:50
        // 以半小時為基準呈現，50分鐘課程每30分鐘一個可選起點
        for (let time = startMinutes; time + 50 <= endMinutes; time += 30) {
          bookableSlots.push({
            start: minutesToTime(time),
            end: minutesToTime(time + 50),
            available: true
          });
        }
      } else {
        // 其他時長：直接使用原始時段
        bookableSlots.push({
          start: startTime,
          end: endTime,
          available: true
        });
      }
    });

    return bookableSlots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }

  // 時間字符串轉分鐘數
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // 分鐘數轉時間字符串
  function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // 處理日期變更
  function handleDateChange() {
    loadAvailableSlots();
  }

  // 處理時段預約
  async function handleSlotBook(slot) {
    if (!selectedCourse || !selectedTeacher || !selectedDate) return;
    try {
      const startLocal = new Date(`${selectedDate}T${slot.start}:00`);
      const endLocal = new Date(`${selectedDate}T${slot.end}:00`);
      const payload = {
        course_id: selectedCourse.id,
        teacher_id: selectedTeacher.id,
        start_at: startLocal.toISOString(),
        end_at: endLocal.toISOString(),
      };
      await bookingApi.create(payload);
      notify.success(`預約成功：${selectedDate} ${slot.start}-${slot.end}`);
      closeBookingModal();
    } catch (err) {
      console.error('建立預約失敗:', err);
      notify.error(err?.data?.message || '預約失敗，請稍後再試');
    }
  }

  // 關閉預約模態框
  function closeBookingModal() {
    showBookingModal = false;
    selectedCourse = null;
    selectedTeacher = null;
    recommendedTeachers = [];
    availableSlots = [];
    selectedDate = '';
  }

  // 格式化價格
  function formatPrice(cents) {
    if (!cents) return '免費';
    return `$${(cents / 100).toFixed(0)}`;
  }

  // 格式化課程時長
  function formatDuration(minutes) {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小時${mins}分鐘` : `${hours}小時`;
    }
    return `${minutes}分鐘`;
  }

  onMount(() => {
    loadCourses();
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
{:else}
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">瀏覽課程</h1>
      <p class="mt-1 text-sm text-gray-500">選擇適合您的學習課程，立即開始學習之旅</p>
    </div>

    <!-- 課程篩選 -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-gray-700">課程類型:</label>
          <select class="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option value="">全部</option>
            <option value="one_on_one">一對一</option>
            <option value="group">小組課</option>
            <option value="workshop">工作坊</option>
            <option value="trial">試聽課</option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-gray-700">課程時長:</label>
          <select class="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option value="">全部</option>
            <option value="25">25分鐘</option>
            <option value="50">50分鐘</option>
            <option value="90">90分鐘</option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-gray-700">價格範圍:</label>
          <select class="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option value="">全部</option>
            <option value="0-500">$0-$5</option>
            <option value="500-1000">$5-$10</option>
            <option value="1000-2000">$10-$20</option>
            <option value="2000+">$20+</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 課程列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each courses as course}
        <CourseCard
          {course}
          on:courseSelect={handleCourseSelect}
        />
      {/each}
    </div>

    {#if courses.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暫無課程</h3>
        <p class="mt-1 text-sm text-gray-500">請稍後再試或聯繫客服</p>
      </div>
    {/if}
  </div>
{/if}

<!-- 預約模態框 -->
{#if showBookingModal && selectedCourse}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" on:click={closeBookingModal}>
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white" on:click|stopPropagation>
      <!-- 模態框標題 -->
      <div class="flex items-center justify-between pb-4 border-b">
        <div>
          <h3 class="text-lg font-medium text-gray-900">預約課程: {selectedCourse.title}</h3>
          <p class="text-sm text-gray-500">
            {formatDuration(selectedCourse.duration_min)} • {formatPrice(selectedCourse.default_price_cents)}
          </p>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600"
          on:click={closeBookingModal}
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mt-6">
        {#if !selectedTeacher}
          <!-- 老師選擇階段 -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">選擇老師</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {#each recommendedTeachers as teacher}
                <div
                  class="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  on:click={() => handleTeacherSelect(teacher)}
                >
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      {#if teacher.photo_url}
                        <img
                          src={teacher.photo_url}
                          alt={teacher.display_name || teacher.name}
                          class="w-12 h-12 rounded-full object-cover"
                        />
                      {:else}
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {(teacher.display_name || teacher.name)?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                      {/if}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h5 class="text-sm font-medium text-gray-900 truncate">
                        {teacher.display_name || teacher.name}
                      </h5>
                      <div class="flex items-center mt-1">
                        <div class="flex items-center">
                          {#each Array(5) as _, i}
                            <svg class="w-3 h-3 {i < Math.floor(teacher.rating || 4.5) ? 'text-yellow-400' : 'text-gray-300'} fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          {/each}
                        </div>
                        <span class="ml-1 text-xs text-gray-600">{(teacher.rating || 4.5).toFixed(1)}</span>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">{teacher.session_count || 0} 堂課</p>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <!-- 時間選擇階段 -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-md font-medium text-gray-900">
                選擇時間 - {selectedTeacher.display_name || selectedTeacher.name}
              </h4>
              <button
                class="text-sm text-blue-600 hover:text-blue-800"
                on:click={() => selectedTeacher = null}
              >
                ← 重新選擇老師
              </button>
            </div>

            <!-- 日期選擇 -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">選擇日期</label>
              <input
                type="date"
                bind:value={selectedDate}
                on:change={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                class="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <!-- 時段選擇 -->
            {#if selectedDate}
              <div>
                <h5 class="text-sm font-medium text-gray-700 mb-3">
                  可預約時段 ({selectedDate})
                </h5>

                {#if isLoadingSlots}
                  <div class="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                {:else if availableSlots.length === 0}
                  <div class="text-center py-8 text-gray-500">
                    <p>該日期暫無可預約時段</p>
                    <p class="text-sm mt-1">請選擇其他日期</p>
                  </div>
                {:else}
                  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                    {#each availableSlots as slot}
                      <button
                        class="p-2 text-sm border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors
                               {slot.available ? 'text-gray-900 bg-white' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}"
                        disabled={!slot.available}
                        on:click={() => handleSlotBook(slot)}
                      >
                        {slot.start}-{slot.end}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
