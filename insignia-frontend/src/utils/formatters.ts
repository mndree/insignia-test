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
