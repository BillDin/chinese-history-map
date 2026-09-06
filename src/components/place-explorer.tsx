"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { formatYear, formatYearRange } from "@/lib/format";
import { HISTORICAL_PERIODS } from "@/lib/historical-periods";
import { MAX_CHGIS_YEAR, MIN_CHGIS_YEAR } from "@/lib/chgis/query";
import type { HistoricalPlace, PlaceSearchResponse } from "@/lib/chgis/types";

const MapView = dynamic(
  () => import("./map-view").then((module) => module.MapView),
  {
    ssr: false,
    loading: () => <div className="map-loading">正在加载地图…</div>,
  },
);

function hasCoordinates(place: HistoricalPlace): boolean {
  return place.longitude !== undefined && place.latitude !== undefined;
}

function MetaLine({ place }: { place: HistoricalPlace }) {
  const dateRange = formatYearRange(place.beginYear, place.endYear);
  return (
    <p className="result-meta">
      {[place.featureType, place.parents[0]?.name, dateRange].filter(Boolean).join(" · ") ||
        "CHGIS 记录"}
    </p>
  );
}

function PlaceDetails({ place }: { place: HistoricalPlace }) {
  const dateRange = formatYearRange(place.beginYear, place.endYear);
  return (
    <aside className="detail-card" aria-label="已选地名详情">
      <div className="detail-heading">
        <div>
          <p className="section-label">已选记录</p>
          <h3>{place.name}</h3>
          {place.pinyin && <p className="pinyin">{place.pinyin}</p>}
        </div>
        <span className={`map-status ${hasCoordinates(place) ? "mapped" : "unmapped"}`}>
          {hasCoordinates(place) ? "可定位" : "无点坐标"}
        </span>
      </div>
      <dl className="detail-grid">
        {place.featureType && (
          <>
            <dt>类型</dt>
            <dd>{place.featureType}</dd>
          </>
        )}
        {dateRange && (
          <>
            <dt>年代</dt>
            <dd>{dateRange}</dd>
          </>
        )}
        {place.parents.length > 0 && (
          <>
            <dt>隶属</dt>
            <dd>{place.parents.map((parent) => parent.name).join("；")}</dd>
          </>
        )}
        {hasCoordinates(place) && (
          <>
            <dt>坐标</dt>
            <dd>
              {place.latitude?.toFixed(5)}° N, {place.longitude?.toFixed(5)}° E
            </dd>
          </>
        )}
        {place.source && (
          <>
            <dt>来源</dt>
            <dd>{place.source}</dd>
          </>
        )}
      </dl>
      {place.canonicalUrl && (
        <a className="source-link" href={place.canonicalUrl} target="_blank" rel="noreferrer">
          查看 CHGIS 原始记录
          <span aria-hidden="true"> ↗</span>
        </a>
      )}
    </aside>
  );
}

export function PlaceExplorer() {
  const [places, setPlaces] = useState<HistoricalPlace[]>([]);
  const [collectedPlaces, setCollectedPlaces] = useState<HistoricalPlace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [queryLabel, setQueryLabel] = useState("");
  const [periodId, setPeriodId] = useState("all");
  const [customYear, setCustomYear] = useState("");
  const [searchedTimeLabel, setSearchedTimeLabel] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const isCustomPeriod = periodId === "custom";
  const selectedPeriod = HISTORICAL_PERIODS.find((period) => period.id === periodId);
  const selectedPlace =
    places.find((place) => place.id === selectedId) ??
    collectedPlaces.find((place) => place.id === selectedId);
  const mappableCount = places.filter(hasCoordinates).length;
  const collectedIds = useMemo(
    () => collectedPlaces.map((place) => place.id),
    [collectedPlaces],
  );
  const mapPlaces = useMemo(() => {
    const uniquePlaces = new Map<string, HistoricalPlace>();
    collectedPlaces.forEach((place) => uniquePlaces.set(place.id, place));
    places.forEach((place) => uniquePlaces.set(place.id, place));
    return Array.from(uniquePlaces.values());
  }, [collectedPlaces, places]);

  const selectPlace = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const toggleCollectedPlace = useCallback((place: HistoricalPlace) => {
    if (!hasCoordinates(place)) return;
    setCollectedPlaces((current) =>
      current.some((collected) => collected.id === place.id)
        ? current.filter((collected) => collected.id !== place.id)
        : [...current, place],
    );
  }, []);

  const removeCollectedPlace = useCallback(
    (id: string) => {
      setCollectedPlaces((current) => current.filter((place) => place.id !== id));
      setSelectedId((current) =>
        current === id && !places.some((place) => place.id === id) ? null : current,
      );
    },
    [places],
  );

  const clearCollectedPlaces = useCallback(() => {
    setCollectedPlaces([]);
    setSelectedId((current) =>
      current && !places.some((place) => place.id === current) ? null : current,
    );
  }, [places]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("query") ?? "").trim();
    const year = isCustomPeriod
      ? String(form.get("year") ?? "").trim()
      : selectedPeriod ? String(selectedPeriod.year) : "";
    if (!query) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setQueryLabel(query);
    setSearchedTimeLabel(
      selectedPeriod
        ? `${selectedPeriod.label} · 代表年份：${formatYear(selectedPeriod.year)} 年`
        : year ? `自定义年代 · ${formatYear(Number(year))} 年` : "不限年代",
    );
    setSelectedId(null);
    setPlaces([]);

    const params = new URLSearchParams({ q: query });
    if (year) params.set("year", year);

    try {
      const response = await fetch(`/api/places?${params.toString()}`, {
        signal: controller.signal,
      });
      const body = (await response.json()) as PlaceSearchResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "搜索失败，请稍后重试。");
      setPlaces(Array.isArray(body.places) ? body.places : []);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "搜索失败，请稍后重试。");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  return (
    <div className="explorer">
      <section className="search-band" aria-label="搜索历史地名">
        <form
          className={`search-form${isCustomPeriod ? " is-custom-period" : ""}`}
          onSubmit={handleSubmit}
        >
          <label className="field place-field">
            <span>历史地名</span>
            <input
              name="query"
              type="search"
              placeholder="例如：长安、洛阳、金陵"
              autoComplete="off"
              required
            />
          </label>
          <label className="field period-field">
            <span>时代</span>
            <select
              name="period"
              value={periodId}
              onChange={(event) => setPeriodId(event.target.value)}
              aria-describedby="period-help"
            >
              <option value="all">不限年代</option>
              <option value="custom">自定义年代</option>
              <optgroup label="按行政格局选择时代（括号内为代表年份）">
                {HISTORICAL_PERIODS.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.label}（{formatYear(period.year)} 年）
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          {isCustomPeriod && (
            <label className="field year-field">
              <span>年份（可选）</span>
              <input
                name="year"
                type="number"
                min={MIN_CHGIS_YEAR}
                max={MAX_CHGIS_YEAR}
                step="1"
                placeholder="例如 742"
                value={customYear}
                onChange={(event) => setCustomYear(event.target.value)}
                aria-describedby="period-help"
              />
            </label>
          )}
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? "查询中…" : "搜索"}
          </button>
        </form>
        <p id="period-help" className="year-help" aria-live="polite">
          {selectedPeriod ? (
            <>
              <strong>代表年份：{formatYear(selectedPeriod.year)} 年。</strong>
              {selectedPeriod.description}按此年份检索，局部区划仍可能随时间变化。
            </>
          ) : isCustomPeriod ? (
            <>输入 {MIN_CHGIS_YEAR} 至 {MAX_CHGIS_YEAR} 的整数年份；公元前 221 年填 −221，留空不限年代。</>
          ) : (
            "按中原王朝行政格局相对稳定的阶段选择时代，以代表年份检索；也可选择自定义年代。"
          )}
        </p>
      </section>

      <div className="workspace">
        <section className="results-panel" aria-label="搜索结果">
          <section className="pin-collection" aria-label="图钉收藏">
            <div className="collection-heading">
              <div>
                <p className="section-label">图钉收藏</p>
                <h2>
                  {collectedPlaces.length > 0
                    ? `${collectedPlaces.length} 个图钉`
                    : "尚未收藏"}
                </h2>
              </div>
              {collectedPlaces.length > 0 && (
                <button
                  className="clear-collection"
                  type="button"
                  onClick={clearCollectedPlaces}
                >
                  清空
                </button>
              )}
            </div>
            {collectedPlaces.length === 0 ? (
              <p className="collection-empty">从搜索结果加入图钉，可跨多次搜索一起对照。</p>
            ) : (
              <ul className="collection-list">
                {collectedPlaces.map((place) => (
                  <li key={place.id} className="collection-item">
                    <button
                      type="button"
                      className={`collection-select ${selectedId === place.id ? "is-selected" : ""}`}
                      aria-pressed={selectedId === place.id}
                      onClick={() => selectPlace(place.id)}
                    >
                      <span className="collection-name">{place.name}</span>
                      <MetaLine place={place} />
                    </button>
                    <button
                      type="button"
                      className="remove-pin"
                      aria-label={`从图钉收藏移除 ${place.name}`}
                      title="移除图钉"
                      onClick={() => removeCollectedPlace(place.id)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="results-heading">
            <div>
              <p className="section-label">搜索结果</p>
              <h2>
                {loading
                  ? "正在查询 CHGIS"
                  : hasSearched
                    ? `${places.length} 条匹配`
                    : "等待搜索"}
              </h2>
            </div>
            {places.length > 0 && (
              <span className="result-count">{mappableCount} 个可定位</span>
            )}
          </div>

          {hasSearched && <p className="search-context">本次查询：{searchedTimeLabel}</p>}

          <div aria-live="polite" className="sr-only">
            {loading && "正在查询 CHGIS"}
            {!loading && error}
            {!loading && !error && hasSearched && `${places.length} 条搜索结果`}
          </div>

          {loading && (
            <div className="state-card loading-state">
              <span className="spinner" aria-hidden="true" />
              <p>正在检索历史地名…</p>
            </div>
          )}
          {!loading && error && (
            <div className="state-card error-state" role="alert">
              <strong>暂时无法完成搜索</strong>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && !hasSearched && (
            <div className="state-card intro-state">
              <span className="seal" aria-hidden="true">舆</span>
              <strong>从一个历史地名开始</strong>
              <p>输入中文地名或拼音；选择时代可以缩小同名记录的范围。</p>
            </div>
          )}
          {!loading && !error && hasSearched && places.length === 0 && (
            <div className="state-card empty-state">
              <strong>没有找到“{queryLabel}”</strong>
              <p>可尝试繁体/简体写法、拼音，或选择“不限年代”后再次搜索。</p>
            </div>
          )}
          {!loading && places.length > 0 && (
            <>
              <p className="ambiguity-note">请选择一条记录；系统不会替您猜测同名地点。</p>
              <ul className="result-list">
                {places.map((place) => {
                  const isCollected = collectedIds.includes(place.id);
                  return (
                    <li key={place.id} className="result-row">
                      <button
                        type="button"
                        className={`result-item ${selectedId === place.id ? "is-selected" : ""}`}
                        aria-pressed={selectedId === place.id}
                        onClick={() => selectPlace(place.id)}
                      >
                        <span className="result-topline">
                          <span className="result-name">{place.name}</span>
                          <span
                            className={`map-status ${hasCoordinates(place) ? "mapped" : "unmapped"}`}
                          >
                            {hasCoordinates(place) ? "地图点" : "无点坐标"}
                          </span>
                        </span>
                        {place.pinyin && <span className="result-pinyin">{place.pinyin}</span>}
                        <MetaLine place={place} />
                      </button>
                      <button
                        type="button"
                        className={`pin-toggle ${isCollected ? "is-collected" : ""}`}
                        aria-label={`${isCollected ? "从图钉收藏移除" : "加入图钉收藏"} ${place.name}`}
                        aria-pressed={isCollected}
                        disabled={!hasCoordinates(place)}
                        title={hasCoordinates(place) ? undefined : "此记录没有可用点坐标"}
                        onClick={() => toggleCollectedPlace(place)}
                      >
                        <span aria-hidden="true">{isCollected ? "✓" : "+"}</span>
                        {isCollected ? "已加入" : "加入"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {selectedPlace && <PlaceDetails place={selectedPlace} />}
        </section>

        <MapView
          places={mapPlaces}
          collectedIds={collectedIds}
          selectedId={selectedId}
          onSelect={selectPlace}
        />
      </div>
    </div>
  );
}
