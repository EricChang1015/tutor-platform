import { wrap } from 'svelte-spa-router/wrap';
import { requireAuth, ROLES } from '../stores/auth.js';

// 頁面組件 (懶加載)
import Login from '../pages/Login.svelte';
import Register from '../pages/Register.svelte';
import Dashboard from '../pages/Dashboard.svelte';
import Profile from '../pages/Profile.svelte';
import NotFound from '../pages/NotFound.svelte';

// 管理員頁面
import AdminDashboard from '../pages/admin/Dashboard.svelte';
import AdminUsers from '../pages/admin/Users.svelte';
import AdminCourses from '../pages/admin/Courses.svelte';
import AdminPricing from '../pages/admin/Pricing.svelte';
import AdminPayouts from '../pages/admin/Payouts.svelte';

// 老師頁面
import TeacherDashboard from '../pages/teacher/Dashboard.svelte';
import TeacherCourses from '../pages/teacher/Courses.svelte';
import TeacherAvailability from '../pages/teacher/Availability.svelte';
import TeacherSessions from '../pages/teacher/Sessions.svelte';
import TeacherPayouts from '../pages/teacher/Payouts.svelte';

// 學生頁面
import StudentDashboard from '../pages/student/Dashboard.svelte';
import StudentCourses from '../pages/student/Courses.svelte';
import StudentBookings from '../pages/student/Bookings.svelte';
import StudentSessions from '../pages/student/Sessions.svelte';
import StudentPackages from '../pages/student/Packages.svelte';

// 路由配置
export const routes = {
  // 公開路由
  '/': Dashboard,
  '/login': Login,
  '/register': Register,
  
  // 需要認證的路由
  '/dashboard': wrap({
    component: Dashboard,
    conditions: [
      () => requireAuth()
    ]
  }),
  
  '/profile': wrap({
    component: Profile,
    conditions: [
      () => requireAuth()
    ]
  }),

  // 管理員路由
  '/admin': wrap({
    component: AdminDashboard,
    conditions: [
      () => requireAuth([ROLES.ADMIN])
    ]
  }),
  
  '/admin/dashboard': wrap({
    component: AdminDashboard,
    conditions: [
      () => requireAuth([ROLES.ADMIN])
    ]
  }),
  
  '/admin/users': wrap({
    component: AdminUsers,
    conditions: [
      () => requireAuth([ROLES.ADMIN])
    ]
  }),
  
  '/admin/courses': wrap({
    component: AdminCourses,
    conditions: [
      () => requireAuth([ROLES.ADMIN])
    ]
  }),
  
  '/admin/pricing': wrap({
    component: AdminPricing,
    conditions: [
      () => requireAuth([ROLES.ADMIN])
    ]
  }),
  
  '/admin/payouts': wrap({
    component: AdminPayouts,
    conditions: [
      () => requireAuth([ROLES.ADMIN])
    ]
  }),

  // 老師路由
  '/teacher': wrap({
    component: TeacherDashboard,
    conditions: [
      () => requireAuth([ROLES.TEACHER])
    ]
  }),
  
  '/teacher/dashboard': wrap({
    component: TeacherDashboard,
    conditions: [
      () => requireAuth([ROLES.TEACHER])
    ]
  }),
  
  '/teacher/courses': wrap({
    component: TeacherCourses,
    conditions: [
      () => requireAuth([ROLES.TEACHER])
    ]
  }),
  
  '/teacher/availability': wrap({
    component: TeacherAvailability,
    conditions: [
      () => requireAuth([ROLES.TEACHER])
    ]
  }),
  
  '/teacher/sessions': wrap({
    component: TeacherSessions,
    conditions: [
      () => requireAuth([ROLES.TEACHER])
    ]
  }),
  
  '/teacher/payouts': wrap({
    component: TeacherPayouts,
    conditions: [
      () => requireAuth([ROLES.TEACHER])
    ]
  }),

  // 學生路由
  '/student': wrap({
    component: StudentDashboard,
    conditions: [
      () => requireAuth([ROLES.STUDENT])
    ]
  }),
  
  '/student/dashboard': wrap({
    component: StudentDashboard,
    conditions: [
      () => requireAuth([ROLES.STUDENT])
    ]
  }),
  
  '/student/courses': wrap({
    component: StudentCourses,
    conditions: [
      () => requireAuth([ROLES.STUDENT])
    ]
  }),
  
  '/student/bookings': wrap({
    component: StudentBookings,
    conditions: [
      () => requireAuth([ROLES.STUDENT])
    ]
  }),
  
  '/student/sessions': wrap({
    component: StudentSessions,
    conditions: [
      () => requireAuth([ROLES.STUDENT])
    ]
  }),
  
  '/student/packages': wrap({
    component: StudentPackages,
    conditions: [
      () => requireAuth([ROLES.STUDENT])
    ]
  }),

  // 404 頁面
  '*': NotFound
};

// 導航菜單配置
export const navigationMenus = {
  admin: [
    {
      title: '儀表板',
      path: '/admin/dashboard',
      icon: 'home',
      permission: 'dashboard.view'
    },
    {
      title: '用戶管理',
      path: '/admin/users',
      icon: 'users',
      permission: 'users.manage'
    },
    {
      title: '課程管理',
      path: '/admin/courses',
      icon: 'book',
      permission: 'courses.manage'
    },
    {
      title: '定價管理',
      path: '/admin/pricing',
      icon: 'dollar-sign',
      permission: 'pricing.manage'
    },
    {
      title: '結算管理',
      path: '/admin/payouts',
      icon: 'credit-card',
      permission: 'payouts.manage'
    }
  ],
  
  teacher: [
    {
      title: '儀表板',
      path: '/teacher/dashboard',
      icon: 'home',
      permission: 'dashboard.view'
    },
    {
      title: '我的課程',
      path: '/teacher/courses',
      icon: 'book',
      permission: 'courses.view'
    },
    {
      title: '可用時段',
      path: '/teacher/availability',
      icon: 'calendar',
      permission: 'availability.manage'
    },
    {
      title: '課程會議',
      path: '/teacher/sessions',
      icon: 'video',
      permission: 'sessions.manage'
    },
    {
      title: '我的結算',
      path: '/teacher/payouts',
      icon: 'credit-card',
      permission: 'payouts.view'
    }
  ],
  
  student: [
    {
      title: '儀表板',
      path: '/student/dashboard',
      icon: 'home',
      permission: 'dashboard.view'
    },
    {
      title: '瀏覽課程',
      path: '/student/courses',
      icon: 'book',
      permission: 'courses.view'
    },
    {
      title: '我的預約',
      path: '/student/bookings',
      icon: 'calendar',
      permission: 'booking.view'
    },
    {
      title: '我的課程',
      path: '/student/sessions',
      icon: 'video',
      permission: 'sessions.view'
    },
    {
      title: '課程包',
      path: '/student/packages',
      icon: 'package',
      permission: 'packages.view'
    }
  ]
};

// 獲取用戶角色對應的默認路由
export function getDefaultRoute(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.TEACHER:
      return '/teacher/dashboard';
    case ROLES.STUDENT:
      return '/student/dashboard';
    default:
      return '/login';
  }
}

// 檢查路由是否需要認證
export function isProtectedRoute(path) {
  const publicRoutes = ['/login', '/register'];
  return !publicRoutes.includes(path);
}

// 檢查用戶是否有權限訪問路由
export function canAccessRoute(path, userRole) {
  if (!userRole) return false;
  
  // 管理員可以訪問所有路由
  if (userRole === ROLES.ADMIN) return true;
  
  // 檢查角色特定路由
  if (path.startsWith('/admin/')) return userRole === ROLES.ADMIN;
  if (path.startsWith('/teacher/')) return userRole === ROLES.TEACHER;
  if (path.startsWith('/student/')) return userRole === ROLES.STUDENT;
  
  // 通用路由
  return true;
}
