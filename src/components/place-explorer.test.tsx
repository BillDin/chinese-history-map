import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
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

const anotherPlace: HistoricalPlace = {
  id: "synthetic_c",
  name: "第三县",
  pinyin: "Disan Xian",
  featureType: "县",
  beginYear: 850,
  endYear: 920,
  latitude: 31.2,
  longitude: 121.5,
  parents: [{ name: "丙府" }],
  source: "CHGIS",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockSearch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ query: "同名", total: 2, places }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

describe("PlaceExplorer", () => {
  it("defaults to all dates without showing a year input or sending a year", async () => {
    mockSearch();
    const user = userEvent.setup();
    render(<PlaceExplorer />);

    expect(screen.getByRole("combobox", { name: "时代" })).toHaveValue("all");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("历史地名"), "长安");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/places?q=%E9%95%BF%E5%AE%89", {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByText("本次查询：不限年代")).toBeInTheDocument();
  });

  it.each([
    ["唐 · 开元十五道（741 年）", "741"],
    ["唐 · 天宝郡制（742 年）", "742"],
    ["秦 · 郡县制（公元前 210 年）", "-210"],
  ])("queries the displayed representative year for %s", async (label, year) => {
    mockSearch();
    const user = userEvent.setup();
    render(<PlaceExplorer />);

    await user.selectOptions(screen.getByRole("combobox", { name: "时代" }),
      screen.getByRole("option", { name: label }));
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("历史地名"), "长安");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      `/api/places?q=%E9%95%BF%E5%AE%89&year=${year}`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it.each(["-222", "-221", "0", "742", "1911"])(
    "accepts the custom integer year %s",
    async (year) => {
      mockSearch();
      const user = userEvent.setup();
      render(<PlaceExplorer />);

      await user.selectOptions(screen.getByRole("combobox", { name: "时代" }), "custom");
      await user.type(screen.getByLabelText("年份（可选）"), year);
      await user.type(screen.getByLabelText("历史地名"), "长安");
      await user.click(screen.getByRole("button", { name: "搜索" }));

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        `/api/places?q=%E9%95%BF%E5%AE%89&year=${year}`,
        { signal: expect.any(AbortSignal) },
      );
    },
  );

  it.each(["-223", "1912", "742.5"])("blocks an invalid custom year %s", async (year) => {
    mockSearch();
    const user = userEvent.setup();
    render(<PlaceExplorer />);

    await user.selectOptions(screen.getByRole("combobox", { name: "时代" }), "custom");
    await user.type(screen.getByLabelText("年份（可选）"), year);
    await user.type(screen.getByLabelText("历史地名"), "长安");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(screen.getByLabelText("年份（可选）")).toBeInvalid();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves the custom year without leaking it into other modes or relabeling old results", async () => {
    mockSearch();
    const user = userEvent.setup();
    render(<PlaceExplorer />);
    const periodSelect = screen.getByRole("combobox", { name: "时代" });
    const searchButton = screen.getByRole("button", { name: "搜索" });

    await user.type(screen.getByLabelText("历史地名"), "长安");
    await user.selectOptions(periodSelect, "custom");
    await user.type(screen.getByLabelText("年份（可选）"), "-221");
    await user.click(searchButton);
    expect(screen.getByText("本次查询：自定义年代 · 公元前 221 年")).toBeInTheDocument();

    await user.selectOptions(periodSelect, "tang-tianbao");
    expect(screen.getByText("本次查询：自定义年代 · 公元前 221 年")).toBeInTheDocument();
    await user.click(searchButton);
    expect(fetch).toHaveBeenLastCalledWith("/api/places?q=%E9%95%BF%E5%AE%89&year=742", {
      signal: expect.any(AbortSignal),
    });

    await user.selectOptions(periodSelect, "all");
    expect(screen.getByText("本次查询：唐 · 天宝郡制 · 代表年份：742 年")).toBeInTheDocument();
    await user.click(searchButton);
    expect(fetch).toHaveBeenLastCalledWith("/api/places?q=%E9%95%BF%E5%AE%89", {
      signal: expect.any(AbortSignal),
    });

    await user.selectOptions(periodSelect, "custom");
    expect(screen.getByLabelText("年份（可选）")).toHaveValue(-221);
    await user.clear(screen.getByLabelText("年份（可选）"));
    await user.click(searchButton);
    expect(fetch).toHaveBeenLastCalledWith("/api/places?q=%E9%95%BF%E5%AE%89", {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByText("本次查询：不限年代")).toBeInTheDocument();
  });

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

  it("keeps collected pins together on the map across searches", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ query: "同名", total: 2, places }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ query: "第三", total: 1, places: [anotherPlace] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );
    const user = userEvent.setup();
    render(<PlaceExplorer />);

    const queryInput = screen.getByLabelText("历史地名");
    await user.type(queryInput, "同名");
    await user.click(screen.getByRole("button", { name: "搜索" }));
    const addButtons = await screen.findAllByRole("button", {
      name: "加入图钉收藏 同名县",
    });
    await user.click(addButtons[0]);

    const collection = screen.getByLabelText("图钉收藏");
    expect(within(collection).getByText("1 个图钉")).toBeInTheDocument();
    expect(within(collection).getByText("甲府", { exact: false })).toBeInTheDocument();

    await user.clear(queryInput);
    await user.type(queryInput, "第三");
    await user.click(screen.getByRole("button", { name: "搜索" }));
    expect(await screen.findByText("1 条匹配")).toBeInTheDocument();

    const map = screen.getByLabelText("测试地图");
    expect(within(map).getByRole("button", { name: "地图选择 同名县" })).toBeInTheDocument();
    expect(within(map).getByRole("button", { name: "地图选择 第三县" })).toBeInTheDocument();

    await user.click(
      within(collection).getByRole("button", { name: "从图钉收藏移除 同名县" }),
    );
    expect(within(map).queryByRole("button", { name: "地图选择 同名县" })).not.toBeInTheDocument();
  });
});
