export function formatWhatsAppLink(phone: string, message?: string): string {
  if (!phone) return '#';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${textParam}`;
}

export function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('62')) {
    clean = '0' + clean.slice(2);
  }
  // Format as 0812-3456-7890 if length >= 10
  if (clean.length >= 10) {
    return clean.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
  }
  return clean;
}
