import assert from "node:assert/strict";
import { PATHS } from "../dist/constants.js";
import { isAllowedClickbusHost, isAllowedConsumerPath } from "../dist/services/path-allowlist.js";
import { ClickbusClientError, consumerRequestUrl } from "../dist/services/clickbus-client.js";

assert.equal(isAllowedConsumerPath(PATHS.places), true);
assert.equal(isAllowedConsumerPath(PATHS.trips), true);
assert.equal(isAllowedConsumerPath(PATHS.orders), true);
assert.equal(isAllowedConsumerPath(`${PATHS.orders}/abc`), true);
assert.equal(isAllowedClickbusHost("https://api.clickbus.com/api/v3/places"), true);
assert.equal(isAllowedClickbusHost("https://evil.example/api/v3/places"), false);
assert.equal(isAllowedConsumerPath("/api/v3/trips"), false);
assert.equal(isAllowedConsumerPath("https://evil.example/x"), false);
assert.equal(isAllowedConsumerPath("/api/v3/places/../evil"), false);

const base = "https://api.clickbus.com";
assert.equal(consumerRequestUrl(base, PATHS.trips), `${base}${PATHS.trips}`);
assert.throws(
  () => consumerRequestUrl(base, "https://evil.example/steal"),
  (err) => err instanceof ClickbusClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl(base, "/api/v3/trips"),
  (err) => err instanceof ClickbusClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl("https://evil.example", PATHS.trips),
  (err) => err instanceof ClickbusClientError && err.code === "PATH_NOT_ALLOWED"
);

console.log(JSON.stringify({ ok: true, suite: "path-allowlist" }, null, 2));
