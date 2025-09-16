<script>
  import { createEventDispatcher } from 'svelte';
  import { currentLanguage, currentLanguageInfo, SUPPORTED_LANGUAGES, switchLanguage } from '../stores/i18n.js';
  
  export let showText = true;
  export let size = 'md'; // sm, md, lg
  
  const dispatch = createEventDispatcher();
  
  let dropdownOpen = false;

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown() {
    dropdownOpen = false;
  }

  function handleLanguageChange(langCode) {
    switchLanguage(langCode);
    closeDropdown();
    dispatch('languageChanged', { language: langCode });
  }

  // 點擊外部關閉下拉菜單
  function handleClickOutside(event) {
    if (!event.target.closest('.language-switcher')) {
      dropdownOpen = false;
    }
  }

  // 尺寸樣式
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative language-switcher">
  <button
    type="button"
    class="flex items-center space-x-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200 {sizeClasses[size]}"
    on:click={toggleDropdown}
    aria-label="Change language"
    aria-expanded={dropdownOpen}
  >
    <!-- 當前語言標誌 -->
    <span class="text-lg" role="img" aria-label={$currentLanguageInfo.name}>
      {$currentLanguageInfo.flag}
    </span>
    
    <!-- 語言名稱（可選） -->
    {#if showText}
      <span class="hidden sm:block font-medium">
        {$currentLanguageInfo.nativeName}
      </span>
    {/if}
    
    <!-- 下拉箭頭 -->
    <svg 
      class="transition-transform duration-200 {iconSizes[size]}"
      class:rotate-180={dropdownOpen}
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- 下拉菜單 -->
  {#if dropdownOpen}
    <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div class="py-1" role="menu" aria-orientation="vertical">
        {#each Object.values(SUPPORTED_LANGUAGES) as language}
          <button
            type="button"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            class:bg-primary-50={$currentLanguage === language.code}
            class:text-primary-700={$currentLanguage === language.code}
            role="menuitem"
            on:click={() => handleLanguageChange(language.code)}
          >
            <!-- 語言標誌 -->
            <span class="text-lg mr-3" role="img" aria-label={language.name}>
              {language.flag}
            </span>
            
            <!-- 語言名稱 -->
            <div class="flex-1 text-left">
              <div class="font-medium">{language.nativeName}</div>
              {#if language.name !== language.nativeName}
                <div class="text-xs text-gray-500">{language.name}</div>
              {/if}
            </div>
            
            <!-- 當前選中標記 -->
            {#if $currentLanguage === language.code}
              <svg class="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .rotate-180 {
    transform: rotate(180deg);
  }
</style>
