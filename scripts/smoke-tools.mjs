import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const expected = [
  "clickbus_book",
  "clickbus_booking_history",
  "clickbus_cancel",
  "clickbus_capabilities",
  "clickbus_connection_status",
  "clickbus_logout",
  "clickbus_privacy_audit",
  "clickbus_search_places",
  "clickbus_search_trips",
  "clickbus_track_booking"
];

const homeDir = mkdtempSync(join(tmpdir(), "clickbus-mcp-smoke-"));
const env = { ...process.env, HOME: homeDir };
delete env.CLICKBUS_ACCESS_TOKEN;
delete env.CLICKBUS_ALLOW_MUTATIONS;
delete env.CLICKBUS_TOKEN_PATH;

const client = new Client({ name: "clickbus-mcp-smoke", version: "0.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env
});
await client.connect(transport);
try {
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  assert.deepEqual(names, expected.sort());

  const place = await client.callTool({
    name: "clickbus_book",
    arguments: {
      from: "sao-paulo-sp-todos",
      to: "rio-de-janeiro-rj-todos",
      departure_date: "2026-09-11",
      response_format: "json"
    }
  });
  const text = JSON.stringify(place.structuredContent ?? {}) + (place.content?.map((c) => c.text || "").join("") || "");
  assert.match(text, /USER_ACTION_REQUIRED|CLICKBUS_ALLOW_MUTATIONS|explicit_user_intent/i);
  assert.equal(place.isError, true);

  const status = await client.callTool({
    name: "clickbus_connection_status",
    arguments: { response_format: "json" }
  });
  assert.equal(status.structuredContent?.unofficial, true);
  assert.equal(status.structuredContent?.mutations_enabled, false);
  assert.equal(status.structuredContent?.never_pays_by_default, true);

  console.log(JSON.stringify({ ok: true, tools: names.length, gated_book: true }, null, 2));
} finally {
  await client.close();
}
