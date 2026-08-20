export function formatYear(year: number | undefined): string | undefined {
  if (year === undefined) return undefined;
  return year < 0 ? `公元前 ${Math.abs(year)}` : String(year);
}

export function formatYearRange(
  beginYear: number | undefined,
  endYear: number | undefined,
): string | undefined {
  const begin = formatYear(beginYear);
  const end = formatYear(endYear);
  if (!begin && !end) return undefined;
  if (begin === end) return begin;
  return `${begin ?? "不详"} – ${end ?? "不详"}`;
}
