export const SERVER_NAME = "clickbus-mcp-server";
export const SERVER_VERSION = "0.1.2";
export const NPM_PACKAGE_NAME = "clickbus-mcp-unofficial";
export const PINNED_NPM_PACKAGE = `${NPM_PACKAGE_NAME}@${SERVER_VERSION}`;

/**
 * Default Brazil ClickBus consumer surface.
 * Live-probed 2026-08-28: JSON 200/400/401 on api.clickbus.com places/trips/orders.
 * Override with CLICKBUS_API_BASE.
 */
export const DEFAULT_API_BASE = "https://api.clickbus.com";

export const CONSUMER_HOSTS: Record<string, string> = {
  API: "https://api.clickbus.com",
  BFF: "https://bff.clickbus.com"
};

/**
 * Unofficial ClickBus consumer paths verified as JSON 200/400/401.
 * GET /api/v3/trips returned 403 HTML and is not shipped.
 */
export const PATHS = {
  places: "/api/v3/places",
  trips: "/api/v4/trips",
  tripsV5: "/api/v5/trips",
  orders: "/api/v3/orders"
} as const;

export const DEFAULT_CLIENT_ID = "1";

export const WEB_ORIGIN = "https://www.clickbus.com.br";
export const WEB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export const REQUEST_TIMEOUT_MS = 20_000;
export const TOKEN_DIR_NAME = ".clickbus-mcp";
