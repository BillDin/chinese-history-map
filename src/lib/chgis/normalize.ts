import type {
  ChgisFacetedPlace,
  ChgisFacetedResponse,
  HistoricalPlace,
} from "./types";

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function integer(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  const valueText = text(value);
  if (!valueText || !/^-?\d+$/.test(valueText)) return undefined;
  const parsed = Number(valueText);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function parseYearRange(value: unknown): {
  beginYear?: number;
  endYear?: number;
} {
  const valueText = text(value);
  if (!valueText) return {};
  const match = /^(-?\d+)\s*~\s*(-?\d+)$/.exec(valueText);
  if (!match) return {};
  return {
    beginYear: integer(match[1]),
    endYear: integer(match[2]),
  };
}

function parsePoint(
  coordinates: unknown,
  geometryType: string | undefined,
): { latitude?: number; longitude?: number } {
  if (geometryType?.toUpperCase() !== "POINT") return {};
  const coordinateText = text(coordinates);
  if (!coordinateText) return {};
  const parts = coordinateText.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    return {};
  }
  const [longitude, latitude] = parts;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return {};
  }
  return { latitude, longitude };
}

export function normalizeFacetedPlace(
  raw: ChgisFacetedPlace,
): HistoricalPlace | undefined {
  const id = text(raw.sys_id);
  const name = text(raw.name);
  if (!id || !name) return undefined;

  const geometryType = text(raw["object type"]);
  const coordinates = parsePoint(raw["xy coordinates"], geometryType);
  const years = parseYearRange(raw.years);
  const parentName = text(raw["parent name"]);
  const parentId = text(raw["parent sys_id"]);
  const source = text(raw["data source"]);
  const providedUri = text(raw.uri);
  const canonicalUrl =
    providedUri?.startsWith("https://chgis.hudci.org/") === true
      ? providedUri
      : `https://chgis.hudci.org/tgaz/placename/${encodeURIComponent(id)}`;

  return {
    id,
    name,
    pinyin: text(raw.transcription),
    featureType: text(raw["feature type"]),
    ...years,
    ...coordinates,
    geometryType,
    parents: parentName ? [{ id: parentId, name: parentName }] : [],
    source,
    canonicalUrl,
  };
}

export function normalizeFacetedResponse(raw: unknown): {
  total: number;
  places: HistoricalPlace[];
} {
  if (!raw || typeof raw !== "object") return { total: 0, places: [] };
  const response = raw as ChgisFacetedResponse;
  const entries = Array.isArray(response.placenames) ? response.placenames : [];
  const places = entries
    .filter((entry): entry is ChgisFacetedPlace => Boolean(entry) && typeof entry === "object")
    .map(normalizeFacetedPlace)
    .filter((place): place is HistoricalPlace => place !== undefined)
    .filter((place) => place.source?.toUpperCase() === "CHGIS");
  const upstreamTotal = integer(response["count of total results"]);

  return {
    total: upstreamTotal ?? places.length,
    places,
  };
}
