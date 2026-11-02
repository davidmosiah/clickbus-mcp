# Security Policy

## Reporting

Report vulnerabilities privately. Never paste ClickBus tokens, addresses, phone numbers, or GPS polylines in public issues.

## Data this server may touch

- Personal ClickBus access token in `CLICKBUS_ACCESS_TOKEN` or `~/.clickbus-mcp/tokens.json` (0600).
- Place search, trip quotes, booking history and booking status from the unofficial consumer surface.

## Fail-closed money rules

- Default is read-only. Booking a ticket does **not** run.
- `clickbus_book` and `clickbus_cancel` require **both** `CLICKBUS_ALLOW_MUTATIONS` enabled and `explicit_user_intent`.
- Guest tokens cannot book, cancel, or charge.
- Logout requires `explicit_user_intent` only.
- Default privacy mode redacts street, phone, email, lat/lng and polylines.

## Local hardening

- Store tokens on a trusted machine only, outside iCloud/Dropbox.
- Do not put `CLICKBUS_ACCESS_TOKEN` in a committed MCP config; prefer `clickbus-mcp-unofficial auth --token`.
- Keep `CLICKBUS_ALLOW_MUTATIONS` unset unless you intentionally want an agent to be able to charge you.
- The npm tarball does not include `~/.clickbus-mcp`, `.env`, or live credentials.

## Optional HTTP

`--http` listens on `127.0.0.1` by default. Requests with an `Origin` header must match `CLICKBUS_MCP_ALLOWED_ORIGIN` or `http://127.0.0.1:<port>`. Binding a non-loopback host is an operator choice; Origin checks are DNS-rebinding mitigation, not a remote multi-tenant product.

The HTTP client only calls allowlisted unofficial consumer paths (places, trips, orders). Arbitrary URLs are rejected in-process. `/api/v3/trips` 403 HTML is not shipped.

## Unofficial surface

ClickBus does not publish a personal consumer API. This package talks to the same undocumented JSON (`api.clickbus.com` by default). It can change without notice.

## Consumer transport restrictions

API-base overrides must be bare HTTPS origins on the provider allowlist and default port 443, without URL credentials, query, or fragment. Redirects fail closed rather than forwarding requests outside the reviewed origin/path. For the 99 passenger connector specifically, this also protects ticket/token body credentials on 307/308 redirects. Overrides are local configuration, not agent input.

CLI tool calls validate the shared field/type/default schemas before handlers. CLI unknown fields are now rejected (the MCP SDK may strip them), so error behavior is intentionally stricter, with a 10,000-element argument budget and 1 MiB JSON text cap. Provider responses are limited to 4 MiB of decoded bytes, including streams without trustworthy Content-Length; over-limit or aborted readers are cancelled.
