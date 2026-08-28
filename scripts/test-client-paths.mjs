import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PATHS } from "../dist/constants.js";
import { peekConfig } from "../dist/services/config.js";
import { ClickbusClient } from "../dist/services/clickbus-client.js";
import { TokenStore } from "../dist/services/token-store.js";

const home = mkdtempSync(join(tmpdir(), "clickbus-client-paths-"));
const tokenPath = join(home, ".clickbus-mcp", "tokens.json");
mkdirSync(join(home, ".clickbus-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.CLICKBUS_TOKEN_PATH = tokenPath;
delete process.env.CLICKBUS_ACCESS_TOKEN;
delete process.env.CLICKBUS_ALLOW_MUTATIONS;

const captured = [];

function headerMap(headers) {
  if (!headers) return {};
  if (typeof headers.forEach === "function") {
    const out = {};
    headers.forEach((value, key) => {
      out[String(key).toLowerCase()] = String(value);
    });
    return out;
  }
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
}

const fetchImpl = async (url, init = {}) => {
  captured.push({
    url: String(url),
    method: String(init.method || "GET").toUpperCase(),
    headers: headerMap(init.headers),
    body: String(init.body || "")
  });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const config = peekConfig(process.env, home);
const tokens = new TokenStore(tokenPath);
const client = new ClickbusClient(config, tokens, fetchImpl);

await client.searchPlaces("sao paulo");
await client.searchTrips({
  from: "sao-paulo-sp-todos",
  to: "rio-de-janeiro-rj-todos",
  departure_date: "2026-09-11"
});
await client.bookingHistory();
await client.trackBooking("bk-1");
await client.book({ from: "sao-paulo-sp-todos" });
await client.cancelBooking("bk-1");

assert.ok(captured.some((row) => row.method === "GET" && row.url.includes(PATHS.places)));
assert.ok(captured.some((row) => row.method === "GET" && row.url.includes(PATHS.trips)));
assert.ok(captured.some((row) => row.method === "GET" && row.url.includes(PATHS.orders)));
assert.ok(captured.some((row) => row.method === "POST" && row.url.includes(PATHS.orders)));

for (const row of captured) {
  assert.equal(row.headers.origin, "https://www.clickbus.com.br");
  assert.doesNotMatch(row.url, /\/api\/v3\/trips/);
  assert.doesNotMatch(row.url, /partners\/api/);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      suite: "client-paths",
      places: PATHS.places,
      trips: PATHS.trips,
      captured: captured.map((row) => `${row.method} ${row.url.replace(config.apiBase, "")}`)
    },
    null,
    2
  )
);
