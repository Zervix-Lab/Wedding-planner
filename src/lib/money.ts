const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Sri Lankan Rupees, e.g. "Rs. 1,234,500". Always Latin digits so it reads the same in both languages. */
export function formatMoney(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return `Rs. ${nf.format(v)}`;
}

export function formatNumber(n: number): string {
  return nf.format(Math.round(Number.isFinite(n) ? n : 0));
}
