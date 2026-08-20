# CHGIS Temporal Gazetteer API notes

Last verified: **2026-08-19**

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
- Coordinates are exposed only when `object type` is exactly `POINT` and both numbers are within geographic bounds.
- `POLYGON` search records may contain a representative-looking pair such as longitude `0`; these are retained in the result list but deliberately marked unmappable.
- The compact `name` field is retained as `name`; it is not guessed to be simplified or traditional.
- The compact `parent name` may include a parent transcription in parentheses and is preserved verbatim.
- Missing or malformed fields are omitted. Unknown fields are ignored.
- Records not identified as `CHGIS` are excluded even though the request also passes `src=CHGIS`.

## Live checks performed

Small read-only queries for `长安`, `长安` in year `742`, `洛阳` in year `742`, and `金乡` returned JSON successfully. Point results appeared near Xi'an, Luoyang, Shandong, and Zhejiang/Henan as expected. No response payloads are committed to the repository; automated tests use tiny synthetic records.

## Known quirks and operational behavior

- The service is scholarly infrastructure and can be slow or unavailable.
- Upstream requests use an 8-second default timeout, no retry loop, `no-store`, and human-readable 502/504 adapter responses.
- Some results are non-point geometries or lack usable coordinates; they remain selectable but do not create map pins.
- Upstream total counts can disagree with usable CHGIS records if malformed or non-CHGIS items are returned. The UI reports the number actually returned by this adapter.
