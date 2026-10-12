export const EUR_TO_BGN_RATE = 1.95583;

export function eurToBgn(eur: number): number {
  return Math.round(eur * EUR_TO_BGN_RATE * 100) / 100;
}

export function bgnToEur(bgn: number): number {
  return Math.round((bgn / EUR_TO_BGN_RATE) * 100) / 100;
}

const _fmt = new Intl.NumberFormat("bg-BG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEur(value: number): string {
  return `${_fmt.format(value)} €`;
}

export function formatBgn(value: number): string {
  return `${_fmt.format(value)} лв.`;
}

/**
 * Нормализира цена към EUR + BGN.
 * Записи без currency (стари) се третират като BGN.
 */
export function entryPrices(
  price: number,
  currency?: "EUR" | "BGN"
): { eur: number; bgn: number } {
  if (currency === "EUR") {
    return { eur: price, bgn: eurToBgn(price) };
  }
  return { eur: bgnToEur(price), bgn: price };
}
