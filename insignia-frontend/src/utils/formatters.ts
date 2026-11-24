/**
 * Formats a number with commas for display
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats wallet units according to the backend specification:
 * - Positive amounts indicate incoming transfers (+1,000 units)
 * - Negative amounts indicate outgoing transfers (-500 units)
 * - Optional includeSign controls whether + is explicitly prepended
 */
export function formatWalletUnits(
  amount: number,
  options: {
    includeSign?: boolean;
    unitLabel?: string;
    absolute?: boolean;
  } = {}
): string {
  const { includeSign = false, unitLabel = 'units', absolute = false } = options;
  const val = absolute ? Math.abs(amount) : amount;
  const formatted = formatNumber(val);

  if (includeSign && amount > 0) {
    return `+${formatted} ${unitLabel}`.trim();
  }
  if (amount < 0 && !absolute) {
    return `-${formatNumber(Math.abs(amount))} ${unitLabel}`.trim();
  }
  return `${formatted} ${unitLabel}`.trim();
}

/**
 * Formats ISO date string into readable date and time
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formats ISO date string to short date (e.g. Nov 18)
 */
export function formatShortDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Known user mappings for instant full name resolution across frontend
 */
export const KNOWN_USER_FULL_NAMES: Record<string, string> = {
  andre: 'Andre Juliansyah',
  azra: 'Azra Putri',
  raka: 'Raka Feisal',
  alice: 'Alice Morgan',
  bob: 'Bob Wilson',
  charlie: 'Charlie Lee',
  david: 'David Kim',
  elena: 'Elena Rostova',
  fiona: 'Fiona Gallagher',
  george: 'George Clark',
  admin: 'System Administrator',
  system: 'System Top-up',
};

/**
 * Resolves full name from username or explicit fallback
 */
export function getUserFullName(username?: string, fallbackFullName?: string): string {
  if (fallbackFullName && fallbackFullName.trim() && fallbackFullName.trim().toLowerCase() !== username?.trim().toLowerCase()) {
    return fallbackFullName;
  }
  const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
  if (KNOWN_USER_FULL_NAMES[clean]) {
    return KNOWN_USER_FULL_NAMES[clean];
  }
  if (!username) return 'Unknown User';
  const raw = username.replace(/^@/, '');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Formats route or username to full names with handle subtitle
 */
export function formatRouteOrName(rawText?: string, explicitFullName?: string): { primary: string; secondary?: string } {
  if (explicitFullName && explicitFullName.trim()) {
    return {
      primary: explicitFullName,
      secondary: rawText && rawText !== explicitFullName ? rawText : undefined,
    };
  }

  const text = (rawText || '').trim();
  if (!text) return { primary: 'Unknown User' };

  if (text.includes('→')) {
    const parts = text.split('→').map((p) => p.trim());
    const fromName = getUserFullName(parts[0]);
    const toName = getUserFullName(parts[1]);
    return {
      primary: `${fromName} → ${toName}`,
      secondary: text,
    };
  }

  const singleName = getUserFullName(text);
  const handle = text.startsWith('@') ? text : `@${text}`;
  return {
    primary: singleName,
    secondary: handle,
  };
}
