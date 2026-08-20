# Chinese Historical Place Browser

A small, open-source research interface for locating Chinese historical placenames on a modern map. Search a Chinese name or pinyin, optionally supply a CHGIS integer year, compare every matching record, and select a result to fly to its historical point coordinate.

The product is intentionally narrow. It is not a historical GIS suite: there are no historical polygons or basemaps, calendar conversion, modern-place matching, automatic disambiguation, accounts, annotations, routing, analytics, database, or offline CHGIS copy.

## Data and licensing

Historical records are fetched live, one user query at a time, from the official [CHGIS Temporal Gazetteer API](https://chgis.hudci.org/tgw/). Results are not persisted. CHGIS coverage and precision vary by period and region, and some records have no usable point geometry.

The original source code is Apache-2.0 licensed. CHGIS, OpenStreetMap, and OpenFreeMap resources are separate third-party works and are **not** covered by that license. Read [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md) before deploying or reusing the application.

## Local development

Requirements: Node.js 20.9 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). No database, API key, or persistent volume is required.

Copy `.env.example` to `.env.local` only when you need to override a default:

| Variable | Scope | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_MAP_STYLE_URL` | browser, build-time | OpenFreeMap Liberty | Any MapLibre-compatible style URL |
| `CHGIS_API_URL` | server | `https://chgis.hudci.org/tgaz/placename` | Faceted-search endpoint override |
| `CHGIS_TIMEOUT_MS` | server | `8000` | Positive upstream timeout in milliseconds |

The map style must provide its required attribution. Do not use a style that removes OpenStreetMap or other provider attribution. The default OpenFreeMap style is supplemented at runtime with a clearer `admin_level=4` boundary layer plus Chinese-first province and major-city labels. These overlays use the style's existing `openmaptiles` vector source; custom styles without that source continue to render normally without the overlays.

## Commands and tests

```bash
pnpm lint       # ESLint and Next.js rules
pnpm typecheck  # strict TypeScript, no output
pnpm test       # synthetic unit and interaction tests
pnpm build      # production build
pnpm start      # run the built application
```

Tests never depend on CHGIS availability and use small fictional records. Live verification is documented in [docs/chgis-api.md](docs/chgis-api.md), which also records the observed schema and normalization choices.

## Architecture

```text
browser
  └─ GET /api/places?q=长安&year=742
       └─ src/lib/chgis/client.ts
            ├─ query validation and URL construction
            ├─ live CHGIS faceted request (no cache/persistence)
            └─ defensive normalization to HistoricalPlace
```

The App Router page keeps search, ambiguity, selection, and error state in React. `MapView` owns the MapLibre instance and markers. MapLibre 6's module worker URL is configured explicitly so vector tiles continue rendering beyond the low-zoom raster relief layer in bundled Next.js builds. The `predev` and `prebuild` scripts copy the worker and its shared module from the installed `maplibre-gl` package to a same-origin runtime path; generated copies are ignored by Git. All CHGIS-specific URLs, upstream keys, parsing, timeouts, and source filtering are isolated under `src/lib/chgis/`.

The API adapter returns 400 for invalid user input, 504 for an upstream timeout, and 502 for other CHGIS failures. Searches have no automatic retry. A result without a usable `POINT` remains in the list and is labeled “无点坐标”.

## Generic production server

Build and run directly:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Or use the standalone multi-stage container:

```bash
docker build -t historical-place-browser .
docker run --rm -p 3000:3000 historical-place-browser
```

For a custom public style, pass it while building because `NEXT_PUBLIC_*` variables are compiled into the client bundle:

```bash
docker build \
  --build-arg NEXT_PUBLIC_MAP_STYLE_URL=https://example.org/style.json \
  -t historical-place-browser .
```

Server-only CHGIS overrides may be supplied at runtime with Docker `-e` flags.

## Limitations

- CHGIS documents historical years approximately `-222` through `1911`; the application enforces that range.
- Search behavior, spellings, dates, coordinates, and administrative relationships are those returned by CHGIS. The application does not infer corrections or modern equivalents.
- The API's compact search schema does not label its single name as simplified or traditional; the UI displays it without guessing.
- Non-point CHGIS records are not plotted in v1.
- The default modern basemap requires network access and is not a historical reconstruction.

## Contributing

Keep the scope focused on rapid placename lookup and selection. Read [AGENTS.md](AGENTS.md), preserve the CHGIS adapter boundary and third-party attribution, add synthetic tests for changed behavior, update the API notes when upstream assumptions change, and run lint, typecheck, tests, and the production build before opening a contribution.
