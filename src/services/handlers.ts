import type { PrivacyMode, ResponseFormat } from "../types.js";
import { peekConfig } from "./config.js";
import { ClickbusClient, ClickbusClientError } from "./clickbus-client.js";
import { TokenStore } from "./token-store.js";
import { applyPrivacy } from "./privacy.js";
import { bulletList, makeError, makeResponse } from "./format.js";
import {
  MutationGateError,
  assertBookAllowed,
  assertCancelBookingAllowed,
  assertExplicitIntent,
  assertLogoutAllowed,
  assertNotGuestForCharge
} from "./mutation-gate.js";
import { buildConnectionStatus } from "./connection-status.js";
import { buildCapabilities } from "./capabilities.js";
import { buildPrivacyAudit } from "./audit.js";

export interface HandlerDeps {
  client?: ClickbusClient;
  tokens?: TokenStore;
  allowMutations?: boolean;
  fetchImpl?: typeof fetch;
}

function deps(extra: HandlerDeps = {}) {
  const config = peekConfig();
  const tokens = extra.tokens ?? new TokenStore(config.tokenPath);
  const client = extra.client ?? new ClickbusClient(config, tokens, extra.fetchImpl);
  const allowMutations = extra.allowMutations ?? config.allowMutations;
  return { config, tokens, client, allowMutations };
}

function gateError(error: unknown) {
  if (error instanceof MutationGateError || error instanceof ClickbusClientError) {
    return makeError(error.message);
  }
  return makeError((error as Error).message);
}

function wrap<T>(payload: T, format: ResponseFormat, title: string, fields: Record<string, unknown>) {
  return makeResponse(payload, format, bulletList(title, fields));
}

export async function handleConnectionStatus(input: { response_format?: ResponseFormat } = {}) {
  const status = await buildConnectionStatus();
  return wrap(status, input.response_format ?? "markdown", "ClickBus MCP · connection", {
    ok: status.ok,
    mutations_enabled: status.mutations_enabled,
    unofficial: true,
    never_pays_by_default: true
  });
}

export async function handleCapabilities(input: { response_format?: ResponseFormat } = {}) {
  const caps = buildCapabilities();
  return wrap(caps, input.response_format ?? "markdown", "ClickBus MCP · capabilities", {
    unofficial: caps.unofficial,
    mutations_enabled: caps.mutations_enabled,
    never_pays_by_default: true
  });
}

export async function handlePrivacyAudit(input: { response_format?: ResponseFormat } = {}) {
  const audit = buildPrivacyAudit();
  return wrap(audit, input.response_format ?? "markdown", "ClickBus MCP · privacy", {
    privacy_mode: audit.privacy_mode,
    mutations_enabled: audit.mutations_enabled,
    redacts_by_default: (audit.redacts_by_default as string[]).join(", ")
  });
}

export async function handleSearchPlaces(
  input: { query: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.searchPlaces(input.query);
    const payload = applyPrivacy({ unofficial: true, places: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "ClickBus places", { unofficial: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleSearchTrips(
  input: {
    from: string;
    to: string;
    departure_date: string;
    privacy_mode?: PrivacyMode;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.searchTrips(input);
    const payload = applyPrivacy(
      { unofficial: true, from: input.from, to: input.to, trips: raw },
      input.privacy_mode ?? config.privacyMode
    );
    return wrap(payload, input.response_format ?? "markdown", "ClickBus trips", {
      unofficial: true,
      from: input.from,
      to: input.to
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleBookingHistory(
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.bookingHistory();
    const payload = applyPrivacy({ unofficial: true, bookings: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "ClickBus booking history", { unofficial: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleTrackBooking(
  input: { booking_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.trackBooking(input.booking_id);
    const payload = applyPrivacy(
      { unofficial: true, status: raw, booking_id: input.booking_id },
      input.privacy_mode ?? config.privacyMode
    );
    return wrap(payload, input.response_format ?? "markdown", "ClickBus booking status", {
      unofficial: true,
      gps_redacted: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleBook(
  input: {
    from: string;
    to: string;
    departure_date: string;
    trip_id?: string;
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { tokens, client, allowMutations } = deps(extra);
  try {
    assertBookAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const stored = await tokens.read();
    assertNotGuestForCharge(stored?.source);
    const raw = await client.book({
      from: input.from,
      to: input.to,
      departureDate: input.departure_date,
      tripId: input.trip_id
    });
    return wrap({ unofficial: true, booking: raw }, input.response_format ?? "json", "ClickBus book", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleCancelBooking(
  input: { booking_id: string; explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens, client, allowMutations } = deps(extra);
  try {
    assertCancelBookingAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const stored = await tokens.read();
    assertNotGuestForCharge(stored?.source);
    const raw = await client.cancelBooking(input.booking_id);
    return wrap({ unofficial: true, cancel: raw }, input.response_format ?? "json", "ClickBus cancel", {
      booking_id: input.booking_id
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleLogout(
  input: { explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens } = deps(extra);
  try {
    assertLogoutAllowed(input.explicit_user_intent);
    assertExplicitIntent(input.explicit_user_intent, "clear the local ClickBus token");
    await tokens.clear();
    return wrap({ unofficial: true, cleared: true }, input.response_format ?? "json", "ClickBus logout", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}
