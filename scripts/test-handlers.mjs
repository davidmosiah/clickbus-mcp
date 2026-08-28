import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TokenStore } from "../dist/services/token-store.js";
import { ClickbusClient } from "../dist/services/clickbus-client.js";
import { peekConfig } from "../dist/services/config.js";
import { handleBook, handleCancelBooking, handleLogout } from "../dist/services/handlers.js";

let fetches = 0;
const fetchImpl = async () => {
  fetches += 1;
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
};

const home = mkdtempSync(join(tmpdir(), "clickbus-handlers-"));
const tokenPath = join(home, ".clickbus-mcp", "tokens.json");
mkdirSync(join(home, ".clickbus-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.CLICKBUS_TOKEN_PATH = tokenPath;
delete process.env.CLICKBUS_ALLOW_MUTATIONS;
delete process.env.CLICKBUS_ACCESS_TOKEN;

const tokens = new TokenStore(tokenPath);
const config = peekConfig(process.env, home);
const client = new ClickbusClient(config, tokens, fetchImpl);
const trip = { from: "sao-paulo-sp-todos", to: "rio-de-janeiro-rj-todos", departure_date: "2026-09-11" };

fetches = 0;
const deniedMutations = await handleBook(
  { ...trip, explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedMutations.isError, true);
assert.match(JSON.stringify(deniedMutations.structuredContent), /USER_ACTION_REQUIRED|CLICKBUS_ALLOW_MUTATIONS/);
assert.equal(fetches, 0, "book must not hit ClickBus when mutations are off");

fetches = 0;
const deniedIntent = await handleBook(
  { ...trip, explicit_user_intent: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedIntent.isError, true);
assert.match(JSON.stringify(deniedIntent.structuredContent), /explicit_user_intent/);
assert.equal(fetches, 0);

const deniedLogout = await handleLogout({ response_format: "json" }, { tokens });
assert.equal(deniedLogout.isError, true);
assert.equal(existsSync(tokenPath), true, "token remains when logout is gated");

const guestPath = join(home, "guest.json");
writeFileSync(guestPath, JSON.stringify({ access_token: "g", source: "guest" }), { mode: 0o600 });
const guestTokens = new TokenStore(guestPath);
const guestClient = new ClickbusClient(config, guestTokens, fetchImpl);
fetches = 0;
const guestPay = await handleBook(
  { ...trip, explicit_user_intent: true, response_format: "json" },
  { client: guestClient, tokens: guestTokens, allowMutations: true, fetchImpl }
);
assert.equal(guestPay.isError, true);
assert.match(JSON.stringify(guestPay.structuredContent), /guest/i);
assert.equal(fetches, 0);

fetches = 0;
const deniedCancel = await handleCancelBooking(
  { booking_id: "bk-1", explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedCancel.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const guestCancel = await handleCancelBooking(
  { booking_id: "bk-1", explicit_user_intent: true, response_format: "json" },
  { client: guestClient, tokens: guestTokens, allowMutations: true, fetchImpl }
);
assert.equal(guestCancel.isError, true);
assert.match(JSON.stringify(guestCancel.structuredContent), /guest/i);
assert.equal(fetches, 0);

console.log(JSON.stringify({ ok: true, suite: "handlers", fetches }, null, 2));
