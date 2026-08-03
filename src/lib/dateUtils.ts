// Utility to format dates in WIB (Waktu Indonesia Barat - UTC+7)

export function getWIBTimestamp(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('id-ID', options);
  const parts = formatter.formatToParts(date);

  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '00';

  const year = getValue('year');
  const month = getValue('month');
  const day = getValue('day');
  const hour = getValue('hour');
  const minute = getValue('minute');
  const second = getValue('second');

  return `${day}/${month}/${year} ${hour}:${minute}:${second} WIB`;
}

export function formatToWIB(dateStringOrIso: string): string {
  if (!dateStringOrIso) return '-';
  if (dateStringOrIso.includes('WIB')) return dateStringOrIso;

  try {
    const d = new Date(dateStringOrIso);
    if (isNaN(d.getTime())) {
      // If it's a string like "2026-08-02 20:30:00", try replacing space with T
      const d2 = new Date(dateStringOrIso.replace(' ', 'T'));
      if (isNaN(d2.getTime())) return dateStringOrIso + ' WIB';
      return getWIBTimestamp(d2);
    }
    return getWIBTimestamp(d);
  } catch {
    return dateStringOrIso + ' WIB';
  }
}
