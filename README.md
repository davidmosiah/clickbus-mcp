<h1 align="center">ClickBus MCP</h1>

<h3 align="center">
  Give your AI agent ClickBus place search, trip prices and booking history.<br>
  Local-first MCP &mdash; <strong>credentials never leave your machine</strong>.<br>
  Booking a ticket is <strong>fail-closed</strong> unless you opt in twice.
</h3>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-22C55E?style=for-the-badge&labelColor=0F172A" alt="License MIT" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/BUILT_FOR-MCP-7C3AED?style=for-the-badge&labelColor=0F172A" alt="Built for MCP" /></a>
</p>

> **Unofficial.** Not affiliated with, endorsed by, or supported by ClickBus. The consumer JSON at `api.clickbus.com` can change without notice. Partner `/api/v3/trips` 403 HTML is not shipped.

> **Never pays by default.** `clickbus_book` and `clickbus_cancel` do nothing unless `CLICKBUS_ALLOW_MUTATIONS` is enabled **and** `explicit_user_intent` is true. Guest tokens cannot charge. Street, phone, email and GPS/latlng polylines are redacted.

## Setup in 60 seconds

```bash
npx -y clickbus-mcp-unofficial setup
npx -y clickbus-mcp-unofficial auth --from-header "Bearer eyJ…"
npx -y clickbus-mcp-unofficial doctor
```

Token is **not** OAuth. Capture a consumer request to `api.clickbus.com` → copy the `Authorization` header. Place/trip search still run without a token; pay tools stay blocked.

Stdio snippet (Claude Desktop, Cursor, Grok Bot). Do **not** set mutations in the snippet:

```json
{
  "mcpServers": {
    "clickbus": {
      "command": "npx",
      "args": ["-y", "clickbus-mcp-unofficial"]
    }
  }
}
```

See [examples/claude-desktop.json](examples/claude-desktop.json) and [examples/grok-bot.md](examples/grok-bot.md).

## Tools

| Kind | Tools |
| --- | --- |
| Read · search | `clickbus_search_places`, `clickbus_search_trips` |
| Read · account | `clickbus_booking_history`, `clickbus_track_booking` |
| Meta | `clickbus_connection_status`, `clickbus_capabilities`, `clickbus_privacy_audit` |
| Gated pay (mutations **and** intent) | `clickbus_book`, `clickbus_cancel` |
| Intent only | `clickbus_logout` |

## HTTP (optional, loopback)

Default transport is **stdio**. Streamable HTTP binds `127.0.0.1` and checks `Origin` against `http://127.0.0.1:<port>` (override with `CLICKBUS_MCP_ALLOWED_ORIGIN`). This is DNS-rebinding mitigation, not a public server.

```bash
npx -y clickbus-mcp-unofficial --http
# GET  http://127.0.0.1:3000/health
# POST http://127.0.0.1:3000/mcp
```

## Security

Tokens live in `~/.clickbus-mcp/tokens.json` (0600). They are not in git, the npm tarball, or default examples. Full notes: [SECURITY.md](SECURITY.md). Agents: [llms.txt](llms.txt).

## Tests

```bash
npm test
```

No live ClickBus login required.
