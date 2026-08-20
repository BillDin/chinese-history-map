# Repository guidance

- Historical place data must come from the live CHGIS Temporal Gazetteer API unless project scope is explicitly changed.
- Do not bulk-download, persist, index, bundle, or redistribute CHGIS data. Do not add a database without an explicit architecture decision.
- Show ambiguous names as separate records. Never guess a match or fabricate coordinates, dates, or administrative relationships.
- Keep all upstream URLs, request behavior, and response parsing behind `src/lib/chgis/`.
- Preserve visible basemap attribution and the licensing boundaries documented in `THIRD_PARTY_DATA.md`.
- Before completing changes, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Update `README.md` and `docs/chgis-api.md` when behavior or upstream assumptions change.
