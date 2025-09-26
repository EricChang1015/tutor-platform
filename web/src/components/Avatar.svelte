<script>
  export let src = '';
  export let name = '';
  export let userId = '';
  export let size = 48; // px
  export let className = '';

  const EMOJIS = ['😀','😃','😄','😁','😆','😊','😎','😍','🥳','🦊','🐼','🐯','🐶','🐱','🦄','🐸','🐵','🐧','🐨','🐰','🐹','🌈','⭐','🌟','🌸','🍀','🍉','🍓','🍎','🍋','⚽','🎵','🎨','🎮'];

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  $: seed = (userId || name || Math.random().toString());
  $: emoji = EMOJIS[hashCode(seed) % EMOJIS.length];
  $: sizeClass = `w-[${size}px] h-[${size}px]`;
</script>

{#if src}
  <img src={src} alt={name} class={`rounded-full object-cover ${className}`} style={`width:${size}px;height:${size}px`} />
{:else}
  <div class={`rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold ${className}`} style={`width:${size}px;height:${size}px`}>
    <span style="font-size: calc(${size}px * 0.5)">{emoji}</span>
  </div>
{/if}

