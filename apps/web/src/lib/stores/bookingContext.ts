import { writable } from 'svelte/store';

export type BookingContext = {
  materialId?: string | null;
  courseTitle?: string | null;
};

const init: BookingContext = {};
const store = writable<BookingContext>(init);

export const bookingContext = {
  subscribe: store.subscribe,
  set(ctx: BookingContext) { store.set(ctx); },
  clear() { store.set({}); }
};

