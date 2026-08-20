import { normalizeFacetedResponse } from "./normalize";
import { buildChgisSearchUrl } from "./query";
import type { PlaceSearchResponse } from "./types";

const DEFAULT_ENDPOINT = "https://chgis.hudci.org/tgaz/placename";
const DEFAULT_TIMEOUT_MS = 8_000;

export class ChgisTimeoutError extends Error {}
export class ChgisUpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function searchChgis(
  query: string,
  year?: number,
): Promise<PlaceSearchResponse> {
  const endpoint = process.env.CHGIS_API_URL ?? DEFAULT_ENDPOINT;
  const timeoutValue = Number(process.env.CHGIS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeoutValue) && timeoutValue > 0
    ? timeoutValue
    : DEFAULT_TIMEOUT_MS;
  const url = buildChgisSearchUrl(endpoint, query, year);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ChgisTimeoutError("CHGIS 请求超时，请稍后重试。");
    }
    throw new ChgisUpstreamError("暂时无法连接 CHGIS，请稍后重试。");
  }

  if (!response.ok) {
    throw new ChgisUpstreamError("CHGIS 服务返回了错误，请稍后重试。", response.status);
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new ChgisUpstreamError("CHGIS 返回了无法识别的数据。");
  }

  const normalized = normalizeFacetedResponse(raw);
  return { query, year, ...normalized };
}
