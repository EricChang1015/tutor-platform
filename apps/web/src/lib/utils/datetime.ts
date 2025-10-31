const TZ = 'Asia/Taipei';

export function slotIndexToLabel(i: number) {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

export function labelToSlotIndex(label: string) {
  const [h, m] = label.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
}

export function formatInTaipei(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(d);
}

export function todayInTaipei() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(now); // YYYY-MM-DD
}

export function toTaipeiIso(date: string, time: string) {
  // date: YYYY-MM-DD, time: HH:mm -> ISO 8601 with +08:00
  return `${date}T${time}:00+08:00`;
}

