export interface HistoricalParent {
  id?: string;
  name: string;
  beginYear?: number;
  endYear?: number;
}

export interface HistoricalPlace {
  id: string;
  name: string;
  nameTraditional?: string;
  nameSimplified?: string;
  pinyin?: string;
  featureType?: string;
  beginYear?: number;
  endYear?: number;
  latitude?: number;
  longitude?: number;
  geometryType?: string;
  parents: HistoricalParent[];
  source?: string;
  canonicalUrl?: string;
}

export interface PlaceSearchResponse {
  query: string;
  year?: number;
  total: number;
  places: HistoricalPlace[];
}

export interface ChgisFacetedPlace {
  sys_id?: unknown;
  uri?: unknown;
  name?: unknown;
  transcription?: unknown;
  years?: unknown;
  "parent sys_id"?: unknown;
  "parent name"?: unknown;
  "feature type"?: unknown;
  "object type"?: unknown;
  "xy coordinates"?: unknown;
  "data source"?: unknown;
  [key: string]: unknown;
}

export interface ChgisFacetedResponse {
  placenames?: unknown;
  "count of total results"?: unknown;
  [key: string]: unknown;
}
