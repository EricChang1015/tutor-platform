<script>
  export let size = 'md'; // sm, md, lg, xl
  export let color = 'primary'; // primary, secondary, white
  export let text = '';

  // 尺寸映射
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // 顏色映射
  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    white: 'border-white'
  };

  // 文字尺寸映射
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
</script>

<div class="flex flex-col items-center justify-center">
  <!-- 旋轉動畫 -->
  <div 
    class="animate-spin rounded-full border-2 border-gray-200 {sizeClasses[size]} {colorClasses[color]}"
    style="border-top-color: transparent;"
  ></div>
  
  <!-- 加載文字 -->
  {#if text}
    <p class="mt-2 {textSizeClasses[size]} text-gray-600">
      {text}
    </p>
  {/if}
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
