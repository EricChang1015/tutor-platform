export default {
  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',
    submit: 'Submit',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    required: 'Required',
    optional: 'Optional',
    all: 'All',
    none: 'None',
    select: 'Select',
    upload: 'Upload',
    download: 'Download',
    view: 'View',
    manage: 'Manage',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    home: 'Home',
    dashboard: 'Dashboard'
  },

  // Authentication
  auth: {
    login: {
      title: 'Sign in to your account',
      subtitle: 'Or',
      createAccount: 'create a new account',
      email: 'Email address',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot your password?',
      loginButton: 'Sign in',
      loggingIn: 'Signing in...',
      quickLogin: 'Quick Login (For Testing)',
      admin: 'Admin',
      teacher: 'Teacher',
      student: 'Student',
      welcome: 'Welcome back, {name}!'
    },
    register: {
      title: 'Create a new account',
      subtitle: 'Already have an account?',
      loginNow: 'Sign in now',
      name: 'Full name',
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Confirm password',
      role: 'Role',
      agreeTerms: 'I agree to the',
      termsOfService: 'Terms of Service',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
      createButton: 'Create account',
      creating: 'Creating account...',
      success: 'Registration successful, welcome {name}!'
    },
    errors: {
      invalidCredentials: 'Invalid email or password',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      nameRequired: 'Name is required',
      invalidEmail: 'Please enter a valid email address',
      passwordMismatch: 'Passwords do not match',
      weakPassword: 'Password is too weak',
      emailExists: 'Email already exists',
      loginFailed: 'Login failed',
      registerFailed: 'Registration failed',
      unauthorized: 'Unauthorized access',
      sessionExpired: 'Session expired, please login again'
    },
    validation: {
      passwordRequirements: 'Password requirements:',
      minLength: 'At least 8 characters long',
      uppercase: 'At least one uppercase letter',
      lowercase: 'At least one lowercase letter',
      number: 'At least one number'
    }
  },

  // Navigation
  nav: {
    menu: 'Menu',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    language: 'Language',
    theme: 'Theme'
  },

  // Dashboard
  dashboard: {
    welcome: 'Welcome back, {name}!',
    todayIsGoodDay: 'Today is a great day for learning',
    readyToTeach: 'Ready to share knowledge today?',
    readyToLearn: 'Ready to start your learning journey today?',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity',
    todaySchedule: 'Today\'s Schedule',
    noTodaySchedule: 'No classes scheduled for today',
    upcomingClasses: 'Upcoming Classes',
    noUpcomingClasses: 'No upcoming classes',
    systemStatus: 'System Status',
    apiService: 'API Service',
    database: 'Database',
    fileStorage: 'File Storage',
    normal: 'Normal'
  },

  // User Management
  users: {
    title: 'User Management',
    subtitle: 'Manage all user accounts in the system',
    createUser: 'Add User',
    searchPlaceholder: 'Search by name or email...',
    roleFilter: 'Filter by Role',
    allRoles: 'All Roles',
    userList: 'User List',
    noUsers: 'No users found matching the criteria',
    user: 'User',
    role: 'Role',
    registrationDate: 'Registration Date',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    editUser: 'Edit User',
    deleteUser: 'Delete User',
    confirmDelete: 'Are you sure you want to delete user "{name}"? This action cannot be undone.',
    createSuccess: 'User created successfully',
    deleteSuccess: 'User deleted successfully',
    loadError: 'Failed to load user list',
    createError: 'Failed to create user',
    deleteError: 'Failed to delete user'
  },

  // Course Management
  courses: {
    title: 'Course Management',
    subtitle: 'Manage all courses in the system',
    myCourses: 'My Courses',
    browseCourses: 'Browse Courses',
    createCourse: 'Add Course',
    searchPlaceholder: 'Search course title or description...',
    courseList: 'Course List',
    noCourses: 'No courses found matching the criteria',
    courseTitle: 'Course Title',
    description: 'Description',
    category: 'Category',
    level: 'Level',
    duration: 'Duration',
    maxStudents: 'Max Students',
    createdAt: 'Created At',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    minutes: 'minutes',
    editCourse: 'Edit Course',
    deleteCourse: 'Delete Course',
    confirmDelete: 'Are you sure you want to delete course "{title}"? This action cannot be undone.',
    createSuccess: 'Course created successfully',
    deleteSuccess: 'Course deleted successfully',
    loadError: 'Failed to load course list',
    createError: 'Failed to create course',
    deleteError: 'Failed to delete course'
  },

  // Roles
  roles: {
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student'
  },

  // Status
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    draft: 'Draft',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
    inProgress: 'In Progress',
    finished: 'Finished',
    paid: 'Paid',
    unpaid: 'Unpaid',
    processing: 'Processing',
    failed: 'Failed'
  },

  // Form Validation
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must be no more than {max} characters',
    numeric: 'Please enter a number',
    positive: 'Please enter a positive number',
    phone: 'Please enter a valid phone number'
  },

  // Notifications
  notifications: {
    success: {
      saved: 'Saved successfully',
      created: 'Created successfully',
      updated: 'Updated successfully',
      deleted: 'Deleted successfully',
      uploaded: 'Uploaded successfully'
    },
    error: {
      generic: 'Operation failed',
      network: 'Network connection failed, please check your network settings',
      unauthorized: 'Insufficient permissions',
      notFound: 'Resource not found',
      validation: 'Form validation failed',
      server: 'Server error'
    }
  },

  // Pages
  pages: {
    notFound: {
      title: 'Page Not Found',
      subtitle: 'Sorry, the page you are looking for does not exist or has been moved.',
      backHome: 'Back to Home',
      backPrevious: 'Go Back',
      support: 'technical support team'
    },
    profile: {
      title: 'Profile',
      subtitle: 'Manage your account information and preferences',
      basicInfo: 'Basic Information',
      accountSecurity: 'Account Security',
      preferences: 'Preferences',
      changePassword: 'Change Password',
      twoFactorAuth: 'Two-Factor Authentication',
      twoFactorDesc: 'Add an extra layer of security to your account',
      language: 'Language',
      languageDesc: 'Choose your preferred language',
      timezone: 'Timezone',
      timezoneDesc: 'Set your timezone',
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive important email notifications',
      enable: 'Enable',
      lastUpdated: 'Last updated',
      unknown: 'Unknown',
      updateSuccess: 'Profile updated successfully',
      updateError: 'Failed to update profile'
    }
  },

  // Features
  features: {
    userManagement: 'User Management',
    courseManagement: 'Course Management',
    pricingManagement: 'Pricing Management',
    payoutManagement: 'Payout Management',
    availabilityManagement: 'Availability Management',
    bookingManagement: 'Booking Management',
    sessionManagement: 'Session Management',
    packageManagement: 'Package Management',
    developing: 'This feature is under development...'
  },

  // Home
  home: {
    hero: {
      title: 'Online Learning',
      subtitle: 'New Experience',
      description: 'Connect excellent teachers and students, providing high-quality one-on-one online tutoring services. Whether you want to learn new skills or share knowledge, we provide the best platform for you.',
      startLearning: 'Start Learning',
      loginNow: 'Sign In Now'
    },
    features: {
      title: 'Features',
      subtitle: 'Why Choose Us?',
      excellentTeachers: 'Excellent Teachers',
      excellentTeachersDesc: 'Carefully selected professional teachers providing high-quality teaching services',
      flexibleTime: 'Flexible Schedule',
      flexibleTimeDesc: 'Arrange your learning time freely to fit your lifestyle',
      onlineTeaching: 'Online Teaching',
      onlineTeachingDesc: 'Convenient online teaching platform, start learning anytime, anywhere'
    }
  }
};
