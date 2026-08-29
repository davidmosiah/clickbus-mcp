# Agent notes

Unofficial local-first ClickBus MCP. Personal bus tickets for David / Life / Grok Bot.

## Commands

- `npm ci`
- `npm test` (typecheck, build, smoke, mutation gate, redaction, handlers, secret-scan)
- `npx clickbus-mcp-unofficial doctor`
- `npx clickbus-mcp-unofficial call clickbus_capabilities --json '{}'`
- Skill: `skill/SKILL.md` (copy into the agent's skills dir; do not duplicate the API client)

## Rules

- Never commit tokens or `~/.clickbus-mcp/`.
- Never enable `CLICKBUS_ALLOW_MUTATIONS` in default examples.
- `clickbus_book` must stay fail-closed in tests without both gates.
- Do not add this connector to the Delx Wellness registry (mobility, not wellness).
- Live ClickBus login is not required for CI.
- Do not ship `/api/v3/trips` (403 HTML). Use `/api/v4/trips` and `/api/v3/places`.
