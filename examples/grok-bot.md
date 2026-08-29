# Grok Bot / local agent stdio

Read-only. Do **not** set `CLICKBUS_ALLOW_MUTATIONS` in the Bot environment.

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

Personal token stays in `~/.clickbus-mcp/tokens.json` on the machine that runs the Bot VM, or as `CLICKBUS_ACCESS_TOKEN` in Runtime Secrets — never in the prompt, Drive, or git.

Book remains listed but returns `USER_ACTION_REQUIRED` until both gates are on **and** the user set `explicit_user_intent`.

Skill path (no MCP client): copy `skill/SKILL.md` into the Bot skills dir and use `clickbus-mcp-unofficial call …`. Same gates. Do not set mutation flags in the Bot environment.
