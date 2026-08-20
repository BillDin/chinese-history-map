import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HistoricalPlace } from "@/lib/chgis/types";
import { PlaceExplorer } from "./place-explorer";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockMap({
      places,
      onSelect,
    }: {
      places: HistoricalPlace[];
      onSelect: (id: string) => void;
    }) {
      return (
        <div aria-label="测试地图">
          {places
            .filter((place) => place.latitude !== undefined && place.longitude !== undefined)
            .map((place) => (
              <button key={place.id} onClick={() => onSelect(place.id)}>
                地图选择 {place.name}
              </button>
            ))}
        </div>
      );
    },
}));

const places: HistoricalPlace[] = [
  {
    id: "synthetic_a",
    name: "同名县",
    pinyin: "Tongming Xian A",
    featureType: "县",
    beginYear: 600,
    endYear: 800,
    latitude: 34.2,
    longitude: 108.9,
    parents: [{ name: "甲府" }],
    source: "CHGIS",
  },
  {
    id: "synthetic_b",
    name: "同名县",
    pinyin: "Tongming Xian B",
    featureType: "县",
    beginYear: 700,
    endYear: 900,
    latitude: 30.6,
    longitude: 114.3,
    parents: [{ name: "乙府" }],
    source: "CHGIS",
  },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockSearch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ query: "同名", total: 2, places }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

describe("PlaceExplorer", () => {
  it("shows ambiguous results without selecting one automatically", async () => {
    mockSearch();
    const user = userEvent.setup();
    render(<PlaceExplorer />);

    await user.type(screen.getByLabelText("历史地名"), "同名");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(await screen.findByText("2 条匹配")).toBeInTheDocument();
    expect(screen.getByText("甲府", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("乙府", { exact: false })).toBeInTheDocument();
    expect(screen.queryByLabelText("已选地名详情")).not.toBeInTheDocument();
  });

  it("selects a mappable result when its map pin is activated", async () => {
    mockSearch();
    const user = userEvent.setup();
    render(<PlaceExplorer />);

    await user.type(screen.getByLabelText("历史地名"), "同名");
    await user.keyboard("{Enter}");
    const pins = await screen.findAllByRole("button", { name: "地图选择 同名县" });
    await user.click(pins[0]);

    const details = screen.getByLabelText("已选地名详情");
    expect(details).toHaveTextContent("Tongming Xian A");
    expect(details).toHaveTextContent("34.20000° N, 108.90000° E");
  });
});
