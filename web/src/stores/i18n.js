import { writable, derived } from 'svelte/store';

// 支援的語言列表
export const SUPPORTED_LANGUAGES = {
  'zh-TW': {
    code: 'zh-TW',
    name: '繁體中文',
    nativeName: '繁體中文',
    flag: '🇹🇼'
  },
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  }
  // 未來可以添加更多語言
  // 'ja': {
  //   code: 'ja',
  //   name: 'Japanese',
  //   nativeName: '日本語',
  //   flag: '🇯🇵'
  // }
};

// 當前語言
export const currentLanguage = writable('zh-TW');

// 翻譯字典
const translations = writable({});

// 載入翻譯文件
async function loadTranslations(lang) {
  try {
    const module = await import(`../locales/${lang}.js`);
    return module.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}:`, error);
    // 如果載入失敗，返回空對象
    return {};
  }
}

// 初始化語言設定
export async function initI18n() {
  // 從 localStorage 獲取保存的語言設定
  const savedLanguage = localStorage.getItem('language');
  
  // 檢測瀏覽器語言
  const browserLanguage = navigator.language || navigator.languages[0];
  
  // 決定使用的語言
  let language = 'zh-TW'; // 默認語言
  
  if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
    language = savedLanguage;
  } else if (SUPPORTED_LANGUAGES[browserLanguage]) {
    language = browserLanguage;
  } else if (browserLanguage.startsWith('en')) {
    language = 'en';
  } else if (browserLanguage.startsWith('zh')) {
    language = 'zh-TW';
  }
  
  await setLanguage(language);
}

// 設定語言
export async function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) {
    console.warn(`Unsupported language: ${lang}`);
    return;
  }
  
  try {
    const translationData = await loadTranslations(lang);
    translations.set(translationData);
    currentLanguage.set(lang);
    
    // 保存到 localStorage
    localStorage.setItem('language', lang);
    
    // 設定 HTML lang 屬性
    document.documentElement.lang = lang;
    
    console.log(`Language set to: ${lang}`);
  } catch (error) {
    console.error(`Failed to set language to ${lang}:`, error);
  }
}

// 翻譯函數
export const t = derived(
  [translations, currentLanguage],
  ([$translations, $currentLanguage]) => {
    return (key, params = {}) => {
      // 支援嵌套鍵值，例如 'auth.login.title'
      const keys = key.split('.');
      let value = $translations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // 如果找不到翻譯，返回鍵值本身
          console.warn(`Translation missing for key: ${key} in language: ${$currentLanguage}`);
          return key;
        }
      }
      
      // 如果值不是字符串，返回鍵值
      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string for key: ${key}`);
        return key;
      }
      
      // 處理參數替換
      let result = value;
      Object.keys(params).forEach(param => {
        const placeholder = `{${param}}`;
        result = result.replace(new RegExp(placeholder, 'g'), params[param]);
      });
      
      return result;
    };
  }
);

// 格式化數字
export const formatNumber = derived(currentLanguage, ($currentLanguage) => {
  return (number, options = {}) => {
    try {
      return new Intl.NumberFormat($currentLanguage, options).format(number);
    } catch (error) {
      return number.toString();
    }
  };
});

// 格式化日期
export const formatDate = derived(currentLanguage, ($currentLanguage) => {
  return (date, options = {}) => {
    try {
      return new Intl.DateTimeFormat($currentLanguage, options).format(new Date(date));
    } catch (error) {
      return date.toString();
    }
  };
});

// 格式化貨幣
export const formatCurrency = derived(currentLanguage, ($currentLanguage) => {
  return (amount, currency = 'TWD') => {
    try {
      return new Intl.NumberFormat($currentLanguage, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  };
});

// 獲取當前語言信息
export const currentLanguageInfo = derived(currentLanguage, ($currentLanguage) => {
  return SUPPORTED_LANGUAGES[$currentLanguage] || SUPPORTED_LANGUAGES['zh-TW'];
});

// 語言切換函數
export function switchLanguage(lang) {
  setLanguage(lang);
}

// 檢查是否為 RTL 語言
export const isRTL = derived(currentLanguage, ($currentLanguage) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes($currentLanguage);
});

// 導出常用函數
export { loadTranslations };
