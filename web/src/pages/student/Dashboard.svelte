<script>
  import { user } from '../../stores/auth.js';
</script>

<div class="space-y-6">
  <div class="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg text-white p-6">
    <h1 class="text-2xl font-bold">
      歡迎回來，{$user?.name}！
    </h1>
    <p class="mt-2 text-green-100">
      準備好開始今天的學習之旅了嗎？
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <a href="/student/courses" class="card hover:shadow-lg transition-shadow duration-200">
      <div class="card-body">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">瀏覽課程</h3>
            <p class="text-sm text-gray-500">探索學習課程</p>
          </div>
        </div>
      </div>
    </a>

    <a href="/student/bookings" class="card hover:shadow-lg transition-shadow duration-200">
      <div class="card-body">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">我的預約</h3>
            <p class="text-sm text-gray-500">管理課程預約</p>
          </div>
        </div>
      </div>
    </a>

    <a href="/student/sessions" class="card hover:shadow-lg transition-shadow duration-200">
      <div class="card-body">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">我的課程</h3>
            <p class="text-sm text-gray-500">參與線上課程</p>
          </div>
        </div>
      </div>
    </a>
  </div>

  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">即將到來的課程</h2>
    </div>
    <div class="card-body">
      <div class="text-center py-8 text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="mt-2">暫無即將到來的課程</p>
      </div>
    </div>
  </div>
</div>
