export default {
  // 通用
  common: {
    loading: '載入中...',
    save: '保存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    create: '創建',
    update: '更新',
    search: '搜尋',
    filter: '篩選',
    refresh: '刷新',
    submit: '提交',
    confirm: '確認',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '關閉',
    yes: '是',
    no: '否',
    ok: '確定',
    error: '錯誤',
    success: '成功',
    warning: '警告',
    info: '信息',
    required: '必填',
    optional: '選填',
    all: '全部',
    none: '無',
    select: '選擇',
    upload: '上傳',
    download: '下載',
    view: '查看',
    manage: '管理',
    settings: '設定',
    profile: '個人資料',
    logout: '登出',
    login: '登入',
    register: '註冊',
    home: '首頁',
    dashboard: '儀表板'
  },

  // 認證
  auth: {
    login: {
      title: '登入您的帳戶',
      subtitle: '或者',
      createAccount: '創建新帳戶',
      email: 'Email 地址',
      password: '密碼',
      rememberMe: '記住我',
      forgotPassword: '忘記密碼？',
      loginButton: '登入',
      loggingIn: '登入中...',
      quickLogin: '快速登入（測試用）',
      admin: '管理員',
      teacher: '老師',
      student: '學生',
      welcome: '歡迎回來，{name}！'
    },
    register: {
      title: '創建新帳戶',
      subtitle: '已有帳戶？',
      loginNow: '立即登入',
      name: '姓名',
      email: 'Email 地址',
      password: '密碼',
      confirmPassword: '確認密碼',
      role: '角色',
      agreeTerms: '我同意',
      termsOfService: '服務條款',
      and: '和',
      privacyPolicy: '隱私政策',
      createButton: '創建帳戶',
      creating: '註冊中...',
      success: '註冊成功，歡迎加入 {name}！'
    },
    errors: {
      invalidCredentials: '帳號或密碼錯誤',
      emailRequired: '請輸入 Email 地址',
      passwordRequired: '請輸入密碼',
      nameRequired: '請輸入姓名',
      invalidEmail: '請輸入有效的 Email 地址',
      passwordMismatch: '密碼確認不一致',
      weakPassword: '密碼強度不足',
      emailExists: 'Email 已被使用',
      loginFailed: '登入失敗',
      registerFailed: '註冊失敗',
      unauthorized: '未授權訪問',
      sessionExpired: '登入已過期，請重新登入'
    },
    validation: {
      passwordRequirements: '密碼要求：',
      minLength: '密碼長度至少 8 個字符',
      uppercase: '密碼必須包含至少一個大寫字母',
      lowercase: '密碼必須包含至少一個小寫字母',
      number: '密碼必須包含至少一個數字'
    }
  },

  // 導航
  nav: {
    menu: '菜單',
    notifications: '通知',
    profile: '個人資料',
    settings: '設定',
    logout: '登出',
    language: '語言',
    theme: '主題'
  },

  // 儀表板
  dashboard: {
    welcome: '歡迎回來，{name}！',
    todayIsGoodDay: '今天是個學習的好日子',
    readyToTeach: '今天準備好分享知識了嗎？',
    readyToLearn: '準備好開始今天的學習之旅了嗎？',
    quickActions: '快速操作',
    recentActivity: '最近活動',
    noRecentActivity: '暫無最近活動',
    todaySchedule: '今日課程',
    noTodaySchedule: '今日暫無課程安排',
    upcomingClasses: '即將到來的課程',
    noUpcomingClasses: '暫無即將到來的課程',
    systemStatus: '系統狀態',
    apiService: 'API 服務',
    database: '資料庫',
    fileStorage: '檔案存儲',
    normal: '正常'
  },

  // 用戶管理
  users: {
    title: '用戶管理',
    subtitle: '管理系統中的所有用戶帳戶',
    createUser: '新增用戶',
    searchPlaceholder: '搜尋姓名或 Email...',
    roleFilter: '角色篩選',
    allRoles: '所有角色',
    userList: '用戶列表',
    noUsers: '沒有找到符合條件的用戶',
    user: '用戶',
    role: '角色',
    registrationDate: '註冊時間',
    status: '狀態',
    actions: '操作',
    active: '啟用',
    editUser: '編輯用戶',
    deleteUser: '刪除用戶',
    confirmDelete: '確定要刪除用戶 "{name}" 嗎？此操作無法撤銷。',
    createSuccess: '用戶創建成功',
    deleteSuccess: '用戶刪除成功',
    loadError: '載入用戶列表失敗',
    createError: '創建用戶失敗',
    deleteError: '刪除用戶失敗'
  },

  // 課程管理
  courses: {
    title: '課程管理',
    subtitle: '管理系統中的所有課程',
    myCourses: '我的課程',
    browseCourses: '瀏覽課程',
    createCourse: '新增課程',
    searchPlaceholder: '搜尋課程標題或描述...',
    courseList: '課程列表',
    noCourses: '沒有找到符合條件的課程',
    courseTitle: '課程標題',
    description: '課程描述',
    category: '分類',
    level: '級別',
    duration: '時長',
    maxStudents: '最大學生數',
    createdAt: '創建時間',
    beginner: '初級',
    intermediate: '中級',
    advanced: '高級',
    minutes: '分鐘',
    editCourse: '編輯課程',
    deleteCourse: '刪除課程',
    confirmDelete: '確定要刪除課程 "{title}" 嗎？此操作無法撤銷。',
    createSuccess: '課程創建成功',
    deleteSuccess: '課程刪除成功',
    loadError: '載入課程列表失敗',
    createError: '創建課程失敗',
    deleteError: '刪除課程失敗'
  },

  // 角色
  roles: {
    admin: '管理員',
    teacher: '老師',
    student: '學生'
  },

  // 狀態
  status: {
    active: '啟用',
    inactive: '停用',
    pending: '待處理',
    approved: '已批准',
    rejected: '已拒絕',
    cancelled: '已取消',
    completed: '已完成',
    draft: '草稿',
    confirmed: '已確認',
    scheduled: '已排程',
    inProgress: '進行中',
    finished: '已結束',
    paid: '已付款',
    unpaid: '未付款',
    processing: '處理中',
    failed: '失敗'
  },

  // 表單驗證
  validation: {
    required: '此欄位為必填',
    email: '請輸入有效的 Email 地址',
    minLength: '至少需要 {min} 個字符',
    maxLength: '最多 {max} 個字符',
    numeric: '請輸入數字',
    positive: '請輸入正數',
    phone: '請輸入有效的手機號碼'
  },

  // 通知訊息
  notifications: {
    success: {
      saved: '保存成功',
      created: '創建成功',
      updated: '更新成功',
      deleted: '刪除成功',
      uploaded: '上傳成功'
    },
    error: {
      generic: '操作失敗',
      network: '網絡連接失敗，請檢查網絡設置',
      unauthorized: '權限不足',
      notFound: '資源不存在',
      validation: '表單驗證失敗',
      server: '服務器錯誤'
    }
  },

  // 頁面標題
  pages: {
    notFound: {
      title: '頁面未找到',
      subtitle: '抱歉，您訪問的頁面不存在或已被移動。',
      backHome: '返回首頁',
      backPrevious: '返回上一頁',
      support: '技術支援團隊'
    },
    profile: {
      title: '個人資料',
      subtitle: '管理您的帳戶信息和偏好設定',
      basicInfo: '基本信息',
      accountSecurity: '帳戶安全',
      preferences: '偏好設定',
      changePassword: '更改密碼',
      twoFactorAuth: '兩步驟驗證',
      twoFactorDesc: '為您的帳戶添加額外的安全保護',
      language: '語言',
      languageDesc: '選擇您的偏好語言',
      timezone: '時區',
      timezoneDesc: '設定您的時區',
      emailNotifications: '郵件通知',
      emailNotificationsDesc: '接收重要的郵件通知',
      enable: '啟用',
      lastUpdated: '上次更新',
      unknown: '未知',
      updateSuccess: '個人資料更新成功',
      updateError: '更新個人資料失敗'
    }
  },

  // 功能模組
  features: {
    userManagement: '用戶管理',
    courseManagement: '課程管理',
    pricingManagement: '定價管理',
    payoutManagement: '結算管理',
    availabilityManagement: '可用時段',
    bookingManagement: '預約管理',
    sessionManagement: '課程會議',
    packageManagement: '課程包',
    developing: '此功能正在開發中...'
  },

  // 首頁
  home: {
    hero: {
      title: '線上學習',
      subtitle: '新體驗',
      description: '連接優秀的老師和學生，提供高品質的一對一線上教學服務。無論您是想要學習新技能還是分享知識，我們都能為您提供最佳的平台。',
      startLearning: '開始學習',
      loginNow: '立即登入'
    },
    features: {
      title: '特色功能',
      subtitle: '為什麼選擇我們？',
      excellentTeachers: '優秀師資',
      excellentTeachersDesc: '嚴格篩選的專業老師，提供高品質的教學服務',
      flexibleTime: '彈性時間',
      flexibleTimeDesc: '自由安排學習時間，配合您的生活節奏',
      onlineTeaching: '線上教學',
      onlineTeachingDesc: '便利的線上教學平台，隨時隨地開始學習'
    }
  }
};
