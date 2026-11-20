export function formatSalary(amount: string, currencyCode: string): string {
  const [wholeRaw = "0", fraction = "00"] = amount.split(".");
  const whole = wholeRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currencyCode} ${whole}.${fraction.slice(0, 2).padEnd(2, "0")}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
