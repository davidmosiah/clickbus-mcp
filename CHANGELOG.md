## 0.1.2 - 2026-09-01

`clickbus_search_trips_v5`, `clickbus_price_preview`, `clickbus_boarding_points`, `clickbus_seat_availability` from live GET /api/v4/trips JSON. Honest gaps: full seat map 500, passengers 404, payment-methods 404, orders/preview 404/405.

## 0.1.1 - 2026-08-28

Skill layer ships in-package (`skill/SKILL.md`). Agents can use MCP tools **or** `call <tool> --json` on the same binary; mutation gates are identical. Default docs still do not contain a copyable mutations assignment.

## 0.1.0 - 2026-08-28

Unofficial local-first ClickBus MCP (stdio + optional loopback HTTP).

### Live-probed paths (JSON 200/400/401)

Host `https://api.clickbus.com` (BFF `https://bff.clickbus.com` allowlisted, not required):

- `GET /api/v3/places?q=&clientId=` → JSON 200
- `GET /api/v4/trips?from=&to=&departureDate=&clientId=` → JSON 200 (price quotes)
- `GET /api/v5/trips` same params → JSON 200 (allowlisted)
- `GET /api/v3/orders` → JSON 401 without auth

`GET /api/v3/trips` returned 403 HTML and was **not** shipped.

### Added

- Read: places, trip search/price, booking history, track.
- Book/cancel fail-closed unless `CLICKBUS_ALLOW_MUTATIONS` and `explicit_user_intent`. Guest cannot charge.
- Token file `~/.clickbus-mcp/tokens.json` mode 0600. `auth --from-header` strips Bearer.
- Host + path allowlist; Origin check on optional HTTP; default bind 127.0.0.1.
- Default privacy redacts street/phone/email/GPS polyline.

### Out of scope

Partner B2B API, wellness registry, Daki, Localiza.
