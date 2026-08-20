"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useRef, useState } from "react";
import { formatYearRange } from "@/lib/format";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [queryLabel, setQueryLabel] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const selectedPlace = places.find((place) => place.id === selectedId);
  const mappableCount = places.filter(hasCoordinates).length;

  const selectPlace = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("query") ?? "").trim();
    const year = String(form.get("year") ?? "").trim();
    if (!query) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setQueryLabel(query);
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
        <form className="search-form" onSubmit={handleSubmit}>
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
          <label className="field year-field">
            <span>年份（可选）</span>
            <input
              name="year"
              type="number"
              min="-222"
              max="1911"
              step="1"
              placeholder="742"
            />
          </label>
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? "查询中…" : "搜索"}
          </button>
        </form>
        <p className="year-help">年份采用 CHGIS 整数纪年：公元前 221 年请输入 −221</p>
      </section>

      <div className="workspace">
        <section className="results-panel" aria-label="搜索结果">
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
              <p>输入中文地名或拼音；加入年份可以缩小同名记录的范围。</p>
            </div>
          )}
          {!loading && !error && hasSearched && places.length === 0 && (
            <div className="state-card empty-state">
              <strong>没有找到“{queryLabel}”</strong>
              <p>可尝试繁体/简体写法、拼音，或清空年份后再次搜索。</p>
            </div>
          )}
          {!loading && places.length > 0 && (
            <>
              <p className="ambiguity-note">请选择一条记录；系统不会替您猜测同名地点。</p>
              <ul className="result-list">
                {places.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={`result-item ${selectedId === place.id ? "is-selected" : ""}`}
                      aria-pressed={selectedId === place.id}
                      onClick={() => selectPlace(place.id)}
                    >
                      <span className="result-topline">
                        <span className="result-name">{place.name}</span>
                        <span className={`map-status ${hasCoordinates(place) ? "mapped" : "unmapped"}`}>
                          {hasCoordinates(place) ? "地图点" : "无点坐标"}
                        </span>
                      </span>
                      {place.pinyin && <span className="result-pinyin">{place.pinyin}</span>}
                      <MetaLine place={place} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {selectedPlace && <PlaceDetails place={selectedPlace} />}
        </section>

        <MapView places={places} selectedId={selectedId} onSelect={selectPlace} />
      </div>
    </div>
  );
}
