<script>
  import Router, { location } from 'svelte-spa-router';
  import { routes } from './utils/routes.js';
  import MainLayout from './layouts/MainLayout.svelte';
  
  // 導入全局樣式
  import './app.css';
</script>

<MainLayout currentRoute={$location}>
  <Router {routes} />
</MainLayout>
