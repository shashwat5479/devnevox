// Currency helpers. Amounts are stored in minor units (cents / paise).
const SIGNS: Record<string, string> = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$",
};

export function currencySign(code: string) {
  return SIGNS[code] ?? `${code} `;
}

export function formatMoney(minor: number, currency = "USD", opts?: { compact?: boolean }) {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: opts?.compact ? "compact" : "standard",
      maximumFractionDigits: opts?.compact ? 1 : major % 1 === 0 ? 0 : 2,
    }).format(major);
  } catch {
    return `${currencySign(currency)}${major.toLocaleString()}`;
  }
}

export function formatRange(min?: number | null, max?: number | null, currency = "USD") {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  return formatMoney((min ?? max)!, currency);
}
