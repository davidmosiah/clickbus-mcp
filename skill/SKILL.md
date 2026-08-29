---
name: clickbus
description: >
  Unofficial ClickBus (Brazil) for place search, trip prices and booking
  history. Use when the user wants bus tickets without opening the ClickBus
  app. Prefer MCP tools if connected; otherwise the package CLI. Never pays
  unless both gates are already on and the user said to book this trip.
---

# ClickBus — skill or MCP

Unofficial. Partner `/api/v3/trips` 403 HTML is not shipped.

Same binary either way. Mutation gates live in the server, not in this file.

## Choose a surface

**MCP** — tools appear natively:

```json
{ "mcpServers": { "clickbus": { "command": "npx", "args": ["-y", "clickbus-mcp-unofficial"] } } }
```

Do not put mutation flags in that snippet.

**Skill / CLI** — no MCP client required:

```bash
npx -y clickbus-mcp-unofficial doctor --json
npx -y clickbus-mcp-unofficial call clickbus_capabilities --json '{}'
npx -y clickbus-mcp-unofficial call clickbus_search_places --json '{"query":"fortaleza"}'
```

If MCP tools named `clickbus_*` are already available, use them. Do not also shell out.

## Setup (once)

```bash
npx -y clickbus-mcp-unofficial setup
npx -y clickbus-mcp-unofficial auth --from-header "Bearer …"
```

Token is a captured `Authorization` from `api.clickbus.com`, stored at `~/.clickbus-mcp/tokens.json` (0600). Place/trip search work without a token; book stays blocked.

## Loop

1. `clickbus_connection_status` (or `doctor --json`). Expect `unofficial` and `never_pays_by_default`.
2. `clickbus_search_places` then `clickbus_search_trips`. Show prices. Street/GPS stay redacted.
3. **Stop.** Do not call `clickbus_book` or `clickbus_cancel` unless the user clearly asked to book/cancel **this** trip. If the tool returns `USER_ACTION_REQUIRED`, report that and stop. Do not invent env flags.

## Never

- Enable mutations from this skill
- Paste tokens into git, chat logs, or the prompt
- Treat guest as able to pay
