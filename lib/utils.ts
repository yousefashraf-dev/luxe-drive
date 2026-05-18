export function formatPhone(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('200')) return digits;
  if (digits.startsWith('20')) return digits;
  if (digits.startsWith('0')) return '20' + digits.slice(1);
  return '20' + digits;
}
