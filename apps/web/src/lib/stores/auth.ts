import { writable } from 'svelte/store';

type Me = { id: string; role: string; name?: string; avatarUrl?: string } | null;

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  me: Me;
};

function makeStore() {
  const init: AuthState = { accessToken: null, refreshToken: null, me: null };
  const store = writable<AuthState>(init);

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('auth');
    if (raw) {
      try {
        store.set(JSON.parse(raw));
      } catch {}
    }
    store.subscribe((v) => {
      localStorage.setItem('auth', JSON.stringify(v));
    });
  }

  return {
    subscribe: store.subscribe,
    setTokens(accessToken: string | null, refreshToken: string | null) {
      store.update((s) => ({ ...s, accessToken, refreshToken }));
    },
    setMe(me: Me) {
      store.update((s) => ({ ...s, me }));
    },
    logout() {
      store.set({ accessToken: null, refreshToken: null, me: null });
    }
  };
}

export const auth = makeStore();

