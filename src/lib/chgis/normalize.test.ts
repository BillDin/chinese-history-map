import { describe, expect, it } from "vitest";
import { normalizeFacetedResponse } from "./normalize";

describe("normalizeFacetedResponse", () => {
  it("normalizes a synthetic CHGIS point record", () => {
    const result = normalizeFacetedResponse({
      "count of total results": "1",
      placenames: [
        {
          sys_id: "test_1",
          uri: "https://chgis.hudci.org/tgaz/placename/test_1",
          name: "示例县",
          transcription: "Shili Xian",
          years: "-120 ~ 742",
          "parent sys_id": "test_parent",
          "parent name": "示例府 (Shili Fu)",
          "feature type": "县 (xian)",
          "object type": "POINT",
          "xy coordinates": "108.90000, 34.20000",
          "data source": "CHGIS",
          "unexpected field": { safely: "ignored" },
        },
      ],
    });

    expect(result).toEqual({
      total: 1,
      places: [
        {
          id: "test_1",
          name: "示例县",
          pinyin: "Shili Xian",
          featureType: "县 (xian)",
          beginYear: -120,
          endYear: 742,
          latitude: 34.2,
          longitude: 108.9,
          geometryType: "POINT",
          parents: [{ id: "test_parent", name: "示例府 (Shili Fu)" }],
          source: "CHGIS",
          canonicalUrl: "https://chgis.hudci.org/tgaz/placename/test_1",
        },
      ],
    });
  });

  it("does not treat polygon representative coordinates as a mappable point", () => {
    const result = normalizeFacetedResponse({
      placenames: [
        {
          sys_id: "test_polygon",
          name: "示例区域",
          "object type": "POLYGON",
          "xy coordinates": "0.00000, 34.20000",
          "data source": "CHGIS",
        },
      ],
    });

    expect(result.places[0]).not.toHaveProperty("longitude");
    expect(result.places[0]).not.toHaveProperty("latitude");
  });

  it("survives malformed entries and excludes non-CHGIS sources", () => {
    const result = normalizeFacetedResponse({
      "count of total results": "not a number",
      placenames: [
        null,
        { sys_id: "missing_name", "data source": "CHGIS" },
        { sys_id: "other_1", name: "Other", "data source": "OTHER" },
      ],
    });

    expect(result).toEqual({ total: 0, places: [] });
  });
});
