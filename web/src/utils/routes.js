import { wrap } from 'svelte-spa-router/wrap';
import { requireAuth, checkAuth, checkPermission, ROLES } from '../stores/auth.js';

// 頁面組件 (懶加載)
import Login from '../pages/Login.svelte';
import Register from '../pages/Register.svelte';
import Dashboard from '../pages/Dashboard.svelte';
import Profile from '../pages/Profile.svelte';
import Settings from '../pages/Settings.svelte';
import NotFound from '../pages/NotFound.svelte';
import LanguageTest from '../pages/LanguageTest.svelte';

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
  '/language-test': LanguageTest,
  
  // 需要認證的路由
  '/dashboard': wrap({
    component: Dashboard,
    conditions: [
      () => checkAuth()
    ]
  }),
  
  '/profile': wrap({
    component: Profile,
    conditions: [
      () => checkAuth()
    ]
  }),

  '/settings': wrap({
    component: Settings,
    conditions: [
      () => checkAuth()
    ]
  }),

  // 管理員路由
  '/admin': wrap({
    component: AdminDashboard,
    conditions: [
      () => checkPermission([ROLES.ADMIN])
    ]
  }),

  '/admin/dashboard': wrap({
    component: AdminDashboard,
    conditions: [
      () => checkPermission([ROLES.ADMIN])
    ]
  }),

  '/admin/users': wrap({
    component: AdminUsers,
    conditions: [
      () => checkPermission([ROLES.ADMIN])
    ]
  }),

  '/admin/courses': wrap({
    component: AdminCourses,
    conditions: [
      () => checkPermission([ROLES.ADMIN])
    ]
  }),

  '/admin/pricing': wrap({
    component: AdminPricing,
    conditions: [
      () => checkPermission([ROLES.ADMIN])
    ]
  }),

  '/admin/payouts': wrap({
    component: AdminPayouts,
    conditions: [
      () => checkPermission([ROLES.ADMIN])
    ]
  }),

  // 老師路由
  '/teacher': wrap({
    component: TeacherDashboard,
    conditions: [
      () => checkPermission([ROLES.TEACHER])
    ]
  }),

  '/teacher/dashboard': wrap({
    component: TeacherDashboard,
    conditions: [
      () => checkPermission([ROLES.TEACHER])
    ]
  }),

  '/teacher/courses': wrap({
    component: TeacherCourses,
    conditions: [
      () => checkPermission([ROLES.TEACHER])
    ]
  }),

  '/teacher/availability': wrap({
    component: TeacherAvailability,
    conditions: [
      () => checkPermission([ROLES.TEACHER])
    ]
  }),

  '/teacher/sessions': wrap({
    component: TeacherSessions,
    conditions: [
      () => checkPermission([ROLES.TEACHER])
    ]
  }),

  '/teacher/payouts': wrap({
    component: TeacherPayouts,
    conditions: [
      () => checkPermission([ROLES.TEACHER])
    ]
  }),

  // 學生路由
  '/student': wrap({
    component: StudentDashboard,
    conditions: [
      () => checkPermission([ROLES.STUDENT])
    ]
  }),

  '/student/dashboard': wrap({
    component: StudentDashboard,
    conditions: [
      () => checkPermission([ROLES.STUDENT])
    ]
  }),

  '/student/courses': wrap({
    component: StudentCourses,
    conditions: [
      () => checkPermission([ROLES.STUDENT])
    ]
  }),

  '/student/bookings': wrap({
    component: StudentBookings,
    conditions: [
      () => checkPermission([ROLES.STUDENT])
    ]
  }),

  '/student/sessions': wrap({
    component: StudentSessions,
    conditions: [
      () => checkPermission([ROLES.STUDENT])
    ]
  }),

  '/student/packages': wrap({
    component: StudentPackages,
    conditions: [
      () => checkPermission([ROLES.STUDENT])
    ]
  }),

  // 404 頁面
  '*': NotFound
};

// 導航菜單配置
export const navigationMenus = {
  admin: [
    {
      titleKey: 'common.dashboard',
      path: '/admin/dashboard',
      icon: 'home',
      permission: 'dashboard.view'
    },
    {
      titleKey: 'features.userManagement',
      path: '/admin/users',
      icon: 'users',
      permission: 'users.manage'
    },
    {
      titleKey: 'features.courseManagement',
      path: '/admin/courses',
      icon: 'book',
      permission: 'courses.manage'
    },
    {
      titleKey: 'features.pricingManagement',
      path: '/admin/pricing',
      icon: 'dollar-sign',
      permission: 'pricing.manage'
    },
    {
      titleKey: 'features.payoutManagement',
      path: '/admin/payouts',
      icon: 'credit-card',
      permission: 'payouts.manage'
    }
  ],
  
  teacher: [
    {
      titleKey: 'common.dashboard',
      path: '/teacher/dashboard',
      icon: 'home',
      permission: 'dashboard.view'
    },
    {
      titleKey: 'courses.myCourses',
      path: '/teacher/courses',
      icon: 'book',
      permission: 'courses.view'
    },
    {
      titleKey: 'features.availabilityManagement',
      path: '/teacher/availability',
      icon: 'calendar',
      permission: 'availability.manage'
    },
    {
      titleKey: 'features.sessionManagement',
      path: '/teacher/sessions',
      icon: 'video',
      permission: 'sessions.manage'
    },
    {
      titleKey: 'features.payoutManagement',
      path: '/teacher/payouts',
      icon: 'credit-card',
      permission: 'payouts.view'
    }
  ],
  
  student: [
    {
      titleKey: 'common.dashboard',
      path: '/student/dashboard',
      icon: 'home',
      permission: 'dashboard.view'
    },
    {
      titleKey: 'courses.browseCourses',
      path: '/student/courses',
      icon: 'book',
      permission: 'courses.view'
    },
    {
      titleKey: 'features.bookingManagement',
      path: '/student/bookings',
      icon: 'calendar',
      permission: 'booking.view'
    },
    {
      titleKey: 'courses.myCourses',
      path: '/student/sessions',
      icon: 'video',
      permission: 'sessions.view'
    },
    {
      titleKey: 'features.packageManagement',
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
