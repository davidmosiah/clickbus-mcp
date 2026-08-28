import { PATHS, SERVER_VERSION } from "../constants.js";
import { peekConfig } from "./config.js";

export function buildCapabilities() {
  const config = peekConfig();
  return {
    unofficial: true as const,
    version: SERVER_VERSION,
    surface: "ClickBus consumer JSON (api.clickbus.com places/trips/orders) — not the partner BFF 403 surface",
    api_base: config.apiBase,
    documented_paths: PATHS,
    mutations_enabled: config.allowMutations,
    never_pays_by_default: true,
    read_tools: [
      "clickbus_search_places",
      "clickbus_search_trips",
      "clickbus_booking_history",
      "clickbus_track_booking"
    ],
    gated_pay: ["clickbus_book", "clickbus_cancel"],
    gated_intent_only: ["clickbus_logout"],
    recommended_agent_flow: [
      "clickbus_connection_status",
      "clickbus_search_places then clickbus_search_trips",
      "clickbus_booking_history / clickbus_track_booking (read, GPS redacted)",
      "Never call clickbus_book unless the user explicitly asked AND CLICKBUS_ALLOW_MUTATIONS is enabled"
    ]
  };
}
