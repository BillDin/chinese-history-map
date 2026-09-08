# CHGIS Temporal Gazetteer API notes

Faceted upstream schema last verified: **2026-08-19**. Later UI/live checks are dated below. Application contract reviewed against the source on **2026-09-07**; that documentation review did not re-verify live upstream data.

[README](../README.md) · [Deployment guide](deployment.md) · [Third-party data terms](../THIRD_PARTY_DATA.md)

## Application API: `GET /api/places`

The browser calls this same-origin Next.js route. It validates the request, then calls the adapter in `src/lib/chgis/`. There is no API key or authentication layer in this application.

| Parameter | Required | Contract |
| --- | --- | --- |
| `q` | Yes | Trimmed placename or pinyin; 1–100 JavaScript string code units after trimming |
| `year` | No | Trimmed integer text from `-222` through `1911`; omitted or blank means no date filter |

Negative years are passed through as supplied. `0` is accepted by the current validator; the application does not define a separate calendar conversion. Period presets resolve to this same `year` parameter. There is no pagination, bounding-box filter, or date-range API.

For a single manual check against a running local instance:

```bash
curl --get "http://localhost:3000/api/places" --data-urlencode "q=长安" --data-urlencode "year=742"
```

On Windows PowerShell, use `curl.exe` in the command above. This makes one live CHGIS query; inspect the response without saving it as a fixture or dataset.

### Successful response

A `200` response is JSON with `Cache-Control: no-store`:

| Field | Meaning |
| --- | --- |
| `query` | Trimmed submitted query |
| `year` | Submitted integer year; omitted when no year was supplied |
| `total` | Parsed upstream total when available, otherwise `places.length` |
| `places` | Normalized CHGIS records; an empty array is a valid no-match result |

The source of truth for record fields is [`HistoricalPlace`](../src/lib/chgis/types.ts). Each retained record has an `id`, `name`, and `parents` array. Pinyin, feature type, years, geometry, coordinates, and other metadata are included only when available. Missing values are omitted, not filled with guessed data. `longitude`/`latitude` are degrees, and only usable point records expose them. An empty `parents` array means no parent name was provided, not that the place had no historical parent.

`canonicalUrl` uses an upstream URL under `https://chgis.hudci.org/`, or a canonical link built from the record ID. No extra record request is made to construct that link. Same-name records retain their separate IDs. `total` may differ from `places.length` after source/record filtering; the UI displays `places.length`, not the upstream total.

### Errors and cancellation

Errors use the JSON shape `{ "error": "human-readable message" }`:

| Status | Meaning |
| --- | --- |
| `400` | Missing/overlong query, non-integer year, or year outside the accepted range |
| `502` | Upstream connection failure, non-success HTTP status, or unreadable JSON |
| `504` | The upstream fetch reached its configured timeout |
| `500` | An unexpected application error |

The current normalizer treats valid JSON with a missing/non-array `placenames` field as an empty result, rather than a schema error. A `200` alone therefore does not prove that the upstream schema is unchanged.

The client can abort its previous browser request. That signal is not forwarded to the CHGIS fetch, which has its own timeout. Neither layer retries automatically. Host/CDN-generated errors can have a different format from this route's JSON errors.

## Endpoint used

The application uses the current HTTPS faceted-search endpoint:

```text
https://chgis.hudci.org/tgaz/placename
```

The official documentation is at [chgis.hudci.org/tgw](https://chgis.hudci.org/tgw/). Older documentation still mentions former Harvard hosts; those are not hard-coded in this application. `CHGIS_API_URL` can replace the server-side endpoint without UI changes.

## Query parameters

Every request sends:

- `n`: the user's trimmed UTF-8 placename query;
- `fmt=json`: request JSON;
- `src=CHGIS`: constrain v1 to the CHGIS source.

When supplied, the validated integer year is sent as `yr`. The accepted range is `-222` through `1911`, matching the API documentation. No calendar conversion is performed.

Observed searches indicate that `n` is prefix-like: the response memo for `长安` reports a match for `长安%`. The application therefore displays every returned alternative and does not interpret the first result as the intended one.

## Period presets and custom years

UI behavior updated **2026-09-06**. The documented single-year `yr` contract was rechecked against the [official usage notes](https://chgis.hudci.org/tgw/index.html). No upstream request or parsing behavior changed.

The **时代** dropdown defaults to **不限年代**. Its presets select a single representative year, displayed in both the option and the help text. **自定义年代** reveals the original optional integer input (`-222`–`1911`, including the existing handling of `0`); a blank value omits `year`. A custom entry stays in React state when hidden but never affects a preset or unrestricted query. Selecting a mode does not fetch anything until the user submits the form. The result panel records the submitted period/year so changing the controls cannot relabel existing results.

`src/lib/historical-periods.ts` contains editorial navigation metadata only. Each year below is a chosen reference snapshot, not an inferred date of a CHGIS place record or a promise that every local jurisdiction stayed unchanged over an entire reign. Presets follow administrative frameworks in dynasties governing the Central Plains, distinguish major reforms within a dynasty, and leave unsettled transitions to custom-year lookup. They do not claim complete chronological coverage or supply historical boundaries. The dynasty label does not filter by government: all CHGIS matches for the selected year remain separate, including contemporary polities and ambiguous names. No date-range aggregation, multi-year requests, CHGIS downloads, caching, or persistence is introduced.

| Preset | Representative year | Reason for a separate entry |
| --- | ---: | --- |
| 秦 · 郡县制 | -210 | Unified Qin commandery/county framework |
| 西汉 · 后期郡国制 | 2 | Late Western Han commanderies and kingdoms |
| 东汉 · 中期郡国制 | 140 | Eastern Han before the late-century breakdown |
| 曹魏 · 州郡县制 | 262 | Wei as the Central Plains reference during the Three Kingdoms |
| 西晋 · 统一初期 | 282 | After reunification and before the War of the Eight Princes |
| 北魏 · 迁都洛阳后 | 497 | Northern reference after the move to Luoyang |
| 隋 · 开皇州县制 | 600 | Prefectures directly governing counties after the 583 reform and reunification |
| 隋 · 大业郡县制 | 609 | Separate reference after the 607 change from prefectures to commanderies |
| 唐 · 贞观十道 | 639 | Ten geographical/inspection circuits, with prefectures and counties |
| 唐 · 开元十五道 | 741 | After the 733 circuit reform, before the Tianbao renaming |
| 唐 · 天宝郡制 | 742 | Reference year for the change from prefectures to commanderies |
| 唐 · 元和后期 | 820 | Later military circuits, separate from early Tang inspection circuits |
| 北宋 · 至道十五路 | 1000 | After the 997 circuit division, before the 1001 Sichuan subdivision |
| 北宋 · 元丰分路 | 1080 | Later Northern Song circuit framework |
| 金 · 泰和时期 | 1208 | Jin administration in the Central Plains, separate from Northern Song |
| 元 · 行省制成熟期 | 1330 | Established provincial framework and centrally administered territory |
| 明 · 两京十三司 | 1582 | Two directly administered regions and thirteen provincial administrations |
| 清 · 康熙分省后 | 1685 | Reference after the early Qing provincial subdivisions |
| 清 · 嘉庆后期 | 1820 | Later prefecture/county framework after Yongzheng/Qianlong adjustments |
| 清 · 宣统时期 | 1909 | Reference after the late Qing creation of provinces in the northeast |

Historical context for these editorial choices (consulted 2026-09-06):

- [弘扬行政区划文化（深圳市龙华区民政局）](https://www.szlhq.gov.cn/lhmzjrlzyj/gkmlpt/content/12/12178/post_12178284.html): explains the changes from Qin/Han commanderies and kingdoms to the Wei/Jin prefecture hierarchy and later administrative levels.
- [海南区历史沿革](https://www.hainanqu.gov.cn/bfhn/yxhn/lsyg/): records the Sui reforms of 583 and 607 and the Tang ten-circuit division.
- [开元十五道](https://zh.wikipedia.org/wiki/开元十五道) and [唐朝行政区划](https://zh.wikipedia.org/wiki/唐朝行政区划): context for the 733, 742 and later Tang distinctions. Early Tang circuits were geographical/inspection areas, not equivalent to later military circuits.
- [至道十五路](https://zh.wikipedia.org/wiki/至道十五路): early and later Northern Song circuit divisions.
- [华林甫：体国经野：中国省制的由来与传承](https://www.nopss.gov.cn/n1/2023/0208/c448861-32620019.html): Yuan, Ming and Qing provincial frameworks and the late Qing additions.
- [清代县级行政区划调整的时空变动与演化机理](https://www.geog.com.cn/CN/abstract/article/0375-5444/53012): explains why early Qing and later Qing snapshots need distinguishing despite a long-lived provincial framework.

## Observed faceted response

The top-level object contains string-valued counts and a `placenames` array. The compact records observed on 2026-08-19 use keys including:

```text
sys_id, uri, name, transcription, years,
parent sys_id, parent name, feature type,
object type, xy coordinates, data source
```

`years` is a string such as `703 ~ 1911`. `xy coordinates` is longitude first, then latitude, such as `108.90697, 34.24642`. The content type is currently `text/json; charset=utf-8` rather than the more common `application/json`.

Canonical JSON is available at `/tgaz/placename/json/{id}` and contains richer spellings, feature type, temporal, spatial, and historical-context objects. The v1 search route deliberately does not fan out into one canonical request per hit; it uses the compact faceted records and links to each canonical record for provenance.

## Normalization decisions

- All unusual upstream field names are confined to `src/lib/chgis/`.
- String counts, years, and coordinates are parsed defensively.
- Coordinates are exposed only when the trimmed `object type` equals `POINT` case-insensitively and both numbers are within geographic bounds.
- `POLYGON` search records may contain a representative-looking pair such as longitude `0`; these are retained in the result list but deliberately marked unmappable.
- The compact `name` field is retained as `name`; it is not guessed to be simplified or traditional.
- The compact `parent name` may include a parent transcription in parentheses and is preserved verbatim.
- Missing or malformed fields are omitted. Unknown fields are ignored.
- Records not identified as `CHGIS` are excluded even though the request also passes `src=CHGIS`.

## Live checks performed

Small read-only queries for `长安`, `长安` in year `742`, `洛阳` in year `742`, and `金乡` returned JSON successfully. Point results appeared near Xi'an, Luoyang, Shandong, and Zhejiang/Henan as expected. No response payloads are committed to the repository; automated tests use tiny synthetic records.

On **2026-09-06**, a browser search for `长安` using the **唐 · 开元十五道** preset (`741`) returned one mappable record. The production UI was also checked for custom-year preservation, rejection of `1912`, accurate submitted-year labels, and a 375-pixel viewport. No live response was saved as a fixture.

On **2026-09-07**, the public [Vercel production instance](https://chinese-history-map.vercel.app) successfully searched `长安` with the **唐 · 天宝郡制** preset (`742`). The route returned `200` JSON with `Cache-Control: no-store` and one mappable record; map selection and session pin collection worked. Empty queries and year `1912` returned `400` JSON. This was a small deployment check, not a comprehensive upstream schema review. No live response payload was saved or committed.

## Known quirks and operational behavior

- The service is scholarly infrastructure and can be slow or unavailable.
- Upstream requests use an 8-second default timeout, no retry loop, `no-store`, and human-readable 502/504 adapter responses.
- Some results are non-point geometries or lack usable coordinates; they remain selectable but do not create map pins.
- Upstream total counts can disagree with usable CHGIS records if malformed or non-CHGIS items are returned. The UI reports the number actually returned by this adapter.
- Keep the route dynamic and preserve `no-store` through any hosting/CDN configuration. Do not introduce response-body logging, persistent caches, bulk probes, or saved live test fixtures. The session pin collection exists only in browser memory and disappears on a page reload.
- The host's request duration must exceed `CHGIS_TIMEOUT_MS` plus response-processing overhead. An invalid or non-positive timeout setting falls back to `8000` ms. See the [deployment guide](deployment.md) for runtime and environment settings.
- Vercel builds use the platform adapter's output; self-hosted/Docker builds use standalone output. This packaging distinction does not change `/api/places`, upstream requests, normalization, or the no-persistence policy.
