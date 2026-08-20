import { describe, expect, it } from "vitest";
import {
  buildChgisSearchUrl,
  parseSearchQuery,
  QueryValidationError,
} from "./query";

describe("parseSearchQuery", () => {
  it("accepts Chinese text with no year", () => {
    expect(parseSearchQuery(new URLSearchParams({ q: " 长安 " }))).toEqual({
      query: "长安",
    });
  });

  it("accepts CHGIS negative and positive integer years", () => {
    expect(parseSearchQuery(new URLSearchParams({ q: "长安", year: "-221" }))).toEqual({
      query: "长安",
      year: -221,
    });
    expect(parseSearchQuery(new URLSearchParams({ q: "长安", year: "742" }))).toEqual({
      query: "长安",
      year: 742,
    });
  });

  it.each(["-223", "1912", "742.5", "not-a-year"])(
    "rejects invalid year %s",
    (year) => {
      expect(() =>
        parseSearchQuery(new URLSearchParams({ q: "长安", year })),
      ).toThrow(QueryValidationError);
    },
  );
});

describe("buildChgisSearchUrl", () => {
  it("sets JSON, CHGIS source, UTF-8 query, and optional year parameters", () => {
    const url = buildChgisSearchUrl(
      "https://chgis.example/tgaz/placename",
      "長安",
      742,
    );
    expect(url.searchParams.get("fmt")).toBe("json");
    expect(url.searchParams.get("src")).toBe("CHGIS");
    expect(url.searchParams.get("n")).toBe("長安");
    expect(url.searchParams.get("yr")).toBe("742");
  });
});
