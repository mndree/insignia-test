/**
 * Formats a phone number input into international Indonesian format (+62 812 3456 7890)
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';

  // Extract only digits
  let digits = value.replace(/\D/g, '');

  if (!digits) return '';

  // Strip international prefix if user started typing with 62 or local 0
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Cap at 13 mobile digits
  digits = digits.slice(0, 13);

  if (!digits) return '';

  // Format into chunks: 3 - 4 - 4 - 2
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 11));
  if (digits.length > 11) parts.push(digits.slice(11, 13));

  return `+62 ${parts.join(' ')}`;
}

/**
 * Normalizes display date (e.g. "15 May 1996", "22/11/2000", "2000-11-22") into ISO YYYY-MM-DD for native date picker inputs
 */
export function parseDisplayDateToIso(displayDate: string): string {
  if (!displayDate) return '';
  const trimmed = displayDate.trim();

  // Handle dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Handle yyyy-mm-dd
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats ISO date string YYYY-MM-DD into display date "15 May 1996"
 */
export function formatIsoToDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a raw number string into dd/mm/yyyy
 */
export function formatDateInput(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
