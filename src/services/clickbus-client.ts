import { PATHS, REQUEST_TIMEOUT_MS, WEB_USER_AGENT } from "../constants.js";
import type { ClickbusConfig, ClickbusTokenSet, FetchLike } from "../types.js";
import { TokenStore } from "./token-store.js";
import { assertAllowedConsumerPath, isAllowedClickbusHost } from "./path-allowlist.js";
import { envAccessToken } from "./config.js";

export class ClickbusClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ClickbusClientError";
  }
}

export function consumerHeaders(origin: string): Record<string, string> {
  return {
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": WEB_USER_AGENT,
    origin,
    referer: `${origin}/`
  };
}

export class ClickbusClient {
  constructor(
    private readonly config: ClickbusConfig,
    private readonly tokens: TokenStore,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async searchPlaces(query: string): Promise<unknown> {
    const params = new URLSearchParams({
      q: query,
      clientId: this.config.clientId
    });
    return this.request("GET", `${PATHS.places}?${params.toString()}`);
  }

  async searchTrips(input: { from: string; to: string; departure_date: string }): Promise<unknown> {
    const params = new URLSearchParams({
      from: input.from,
      to: input.to,
      departureDate: input.departure_date,
      clientId: this.config.clientId
    });
    return this.request("GET", `${PATHS.trips}?${params.toString()}`);
  }

  async bookingHistory(): Promise<unknown> {
    return this.request("GET", PATHS.orders, { auth: true });
  }

  async trackBooking(orderId: string): Promise<unknown> {
    return this.request("GET", `${PATHS.orders}/${encodeURIComponent(orderId)}`, { auth: true });
  }

  async book(body: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", PATHS.orders, { auth: true, body });
  }

  async cancelBooking(orderId: string): Promise<unknown> {
    return this.request("POST", `${PATHS.orders}/${encodeURIComponent(orderId)}`, {
      auth: true,
      body: { action: "cancel", id: orderId }
    });
  }

  private async request(
    method: "GET" | "POST",
    pathAndQuery: string,
    options: { auth?: boolean; body?: Record<string, unknown> } = {}
  ): Promise<unknown> {
    const path = pathAndQuery.split("?")[0] ?? pathAndQuery;
    const url = consumerRequestUrl(this.config.apiBase, path) + (pathAndQuery.includes("?") ? `?${pathAndQuery.split("?")[1]}` : "");
    const headers: Record<string, string> = { ...consumerHeaders(this.config.origin) };
    const token = await this.resolveAccess();
    if (options.auth && !token) {
      throw new ClickbusClientError(
        "No ClickBus access token. Run `clickbus-mcp-unofficial auth --from-header \"Bearer …\"` or set CLICKBUS_ACCESS_TOKEN.",
        undefined,
        "AUTH_REQUIRED"
      );
    }
    if (token) {
      headers.authorization = `Bearer ${token.access_token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { raw: text.slice(0, 400) };
      }
      if (!response.ok) {
        throw new ClickbusClientError(
          `Unofficial ClickBus surface returned HTTP ${response.status} for ${method} ${path}. The consumer API is undocumented and may change.`,
          response.status,
          "CLICKBUS_UPSTREAM_UNAVAILABLE"
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof ClickbusClientError) throw error;
      throw new ClickbusClientError(
        `ClickBus request failed: ${(error as Error).message}`,
        undefined,
        "CLICKBUS_UPSTREAM_UNAVAILABLE"
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async resolveAccess(): Promise<ClickbusTokenSet | null> {
    const file = await this.tokens.read();
    if (file?.access_token) return file;
    const envToken = envAccessToken();
    if (envToken) return { access_token: envToken, source: "user", token_type: "Bearer" };
    return null;
  }
}

export function consumerRequestUrl(apiBase: string, path: string): string {
  try {
    assertAllowedConsumerPath(path);
  } catch (error) {
    throw new ClickbusClientError((error as Error).message, undefined, "PATH_NOT_ALLOWED");
  }
  const url = apiBase.replace(/\/$/, "") + path;
  if (!isAllowedClickbusHost(url)) {
    throw new ClickbusClientError(
      `HOST_NOT_ALLOWED: refusing unofficial ClickBus host ${apiBase}`,
      undefined,
      "PATH_NOT_ALLOWED"
    );
  }
  return url;
}
