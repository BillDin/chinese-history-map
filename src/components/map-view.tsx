"use client";

import * as maplibregl from "maplibre-gl";
import { LngLatBounds, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { HistoricalPlace } from "@/lib/chgis/types";

maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

interface MapViewProps {
  places: HistoricalPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/liberty";

function addResearchContextLayers(map: maplibregl.Map) {
  if (!map.getSource("openmaptiles")) return;

  if (!map.getLayer("research-province-boundaries")) {
    const firstSymbolLayer = map
      .getStyle()
      .layers.find((layer) => layer.type === "symbol")?.id;

    map.addLayer(
      {
        id: "research-province-boundaries",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        minzoom: 2.5,
        maxzoom: 12,
        filter: [
          "all",
          ["==", ["get", "admin_level"], 4],
          ["!=", ["get", "maritime"], 1],
          ["!=", ["get", "disputed"], 1],
          ["!", ["has", "claimed_by"]],
        ],
        paint: {
          "line-color": "#8b6e64",
          "line-dasharray": [2, 1.5],
          "line-opacity": 0.82,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.8, 7, 1.5, 11, 2],
        },
      },
      firstSymbolLayer,
    );
  }

  for (const layerId of ["label_state", "label_city", "label_city_capital"]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "text-field", [
        "coalesce",
        ["get", "name:zh-Hans"],
        ["get", "name:zh"],
        ["get", "name"],
      ]);
    }
  }

  if (map.getLayer("label_state")) {
    map.setLayerZoomRange("label_state", 2.8, 9);
    map.setLayoutProperty("label_state", "text-transform", "none");
    map.setLayoutProperty("label_state", "text-size", [
      "interpolate",
      ["linear"],
      ["zoom"],
      3,
      10,
      6,
      13,
      9,
      16,
    ]);
  }

  if (map.getLayer("label_city")) {
    map.setLayerZoomRange("label_city", 3, 18);
  }
  if (map.getLayer("label_city_capital")) {
    map.setLayerZoomRange("label_city_capital", 2.8, 18);
  }

  for (const layerId of ["label_country_1", "label_country_2", "label_country_3"]) {
    if (map.getLayer(layerId)) {
      map.setLayerZoomRange(layerId, 0, 5.5);
    }
  }
}

function hasCoordinates(
  place: HistoricalPlace,
): place is HistoricalPlace & { longitude: number; latitude: number } {
  return place.longitude !== undefined && place.latitude !== undefined;
}

export function MapView({ places, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; element: HTMLButtonElement }>>(
    new Map(),
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const markers = markersRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [104, 35],
      zoom: 3.25,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: { compact: false },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("style.load", () => addResearchContextLayers(map));
    mapRef.current = map;

    return () => {
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;

    markers.forEach(({ marker }) => marker.remove());
    markers.clear();
    const mappablePlaces = places.filter(hasCoordinates);

    for (const place of mappablePlaces) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "map-marker";
      element.setAttribute("aria-label", `在地图上选择 ${place.name}`);
      element.title = place.name;
      element.addEventListener("click", () => onSelect(place.id));
      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);
      markers.set(place.id, { marker, element });
    }

    if (mappablePlaces.length === 1) {
      const place = mappablePlaces[0];
      map.flyTo({ center: [place.longitude, place.latitude], zoom: 8, essential: true });
    } else if (mappablePlaces.length > 1) {
      const bounds = new LngLatBounds();
      mappablePlaces.forEach((place) => bounds.extend([place.longitude, place.latitude]));
      map.fitBounds(bounds, { padding: 70, maxZoom: 9, duration: 700 });
    }

    return () => {
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
    };
  }, [places, onSelect]);

  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      element.classList.toggle("is-selected", id === selectedId);
      element.setAttribute("aria-pressed", String(id === selectedId));
    });
    if (!selectedId) return;
    const selected = places.find((place) => place.id === selectedId);
    if (!selected || !hasCoordinates(selected)) return;
    mapRef.current?.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 8),
      essential: true,
    });
  }, [places, selectedId]);

  return (
    <section className="map-panel" aria-label="历史地名地图">
      <div ref={containerRef} className="map-container" />
      <div className="map-caption">现代底图 · 虚线为现代省级边界 · 历史坐标来自 CHGIS</div>
    </section>
  );
}
