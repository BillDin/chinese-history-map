export const MIN_CHGIS_YEAR = -222;
export const MAX_CHGIS_YEAR = 1911;

export class QueryValidationError extends Error {}

export function parseSearchQuery(searchParams: URLSearchParams): {
  query: string;
  year?: number;
} {
  const query = (searchParams.get("q") ?? "").trim();
  if (!query) throw new QueryValidationError("请输入历史地名。");
  if (query.length > 100) throw new QueryValidationError("地名不能超过 100 个字符。");

  const yearText = (searchParams.get("year") ?? "").trim();
  if (!yearText) return { query };
  if (!/^-?\d+$/.test(yearText)) {
    throw new QueryValidationError("年份必须是整数。");
  }
  const year = Number(yearText);
  if (!Number.isSafeInteger(year) || year < MIN_CHGIS_YEAR || year > MAX_CHGIS_YEAR) {
    throw new QueryValidationError(
      `年份必须在 ${MIN_CHGIS_YEAR} 至 ${MAX_CHGIS_YEAR} 之间。`,
    );
  }
  return { query, year };
}

export function buildChgisSearchUrl(
  baseUrl: string,
  query: string,
  year?: number,
): URL {
  const url = new URL(baseUrl);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("n", query);
  url.searchParams.set("src", "CHGIS");
  if (year !== undefined) url.searchParams.set("yr", String(year));
  return url;
}
