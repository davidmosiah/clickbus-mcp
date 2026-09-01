import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  BookInputSchema,
  BookingIdInputSchema,
  CancelBookingInputSchema,
  LogoutInputSchema,
  PlacesInputSchema,
  ReadInputSchema,
  ResponseOnlyInputSchema,
  TripsInputSchema
} from "../schemas/common.js";
import {
  handleBoardingPoints,
  handleBook,
  handleBookingHistory,
  handleCancelBooking,
  handleCapabilities,
  handleConnectionStatus,
  handleLogout,
  handlePricePreview,
  handlePrivacyAudit,
  handleSearchPlaces,
  handleSearchTrips,
  handleSearchTripsV5,
  handleSeatAvailability,
  handleTrackBooking
} from "../services/handlers.js";
import type { ToolResponse } from "../types.js";

type CallFn = (args: Record<string, unknown>) => Promise<ToolResponse>;
const call =
  <T,>(fn: (input: T) => Promise<ToolResponse>): CallFn =>
  (args) =>
    fn(args as T);

/** Same handlers as MCP tools — CLI `call` uses this so skill-only clients hit the identical gates. */
export const TOOL_CALLS: Record<string, CallFn> = {
  clickbus_connection_status: call(handleConnectionStatus),
  clickbus_capabilities: call(handleCapabilities),
  clickbus_privacy_audit: call(handlePrivacyAudit),
  clickbus_search_places: call(handleSearchPlaces),
  clickbus_search_trips: call(handleSearchTrips),
  clickbus_search_trips_v5: call(handleSearchTripsV5),
  clickbus_price_preview: call(handlePricePreview),
  clickbus_boarding_points: call(handleBoardingPoints),
  clickbus_seat_availability: call(handleSeatAvailability),
  clickbus_booking_history: call(handleBookingHistory),
  clickbus_track_booking: call(handleTrackBooking),
  clickbus_book: call(handleBook),
  clickbus_cancel: call(handleCancelBooking),
  clickbus_logout: call(handleLogout)
};

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const gatedWrite = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } as const;

export function registerClickbusTools(server: McpServer): void {
  server.registerTool(
    "clickbus_connection_status",
    {
      title: "ClickBus connection status",
      description: "Local doctor: token present, mutations off by default, unofficial ClickBus consumer surface.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handleConnectionStatus(args)
  );

  server.registerTool(
    "clickbus_capabilities",
    {
      title: "ClickBus capabilities",
      description: "What this unofficial MCP can read and which writes stay gated.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handleCapabilities(args)
  );

  server.registerTool(
    "clickbus_privacy_audit",
    {
      title: "ClickBus privacy audit",
      description: "Shows redaction defaults (street/phone/GPS) and that book is off unless both gates are set.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handlePrivacyAudit(args)
  );

  server.registerTool(
    "clickbus_search_places",
    {
      title: "Search ClickBus places",
      description: "Read-only place search (terminals/cities). Does not book a ticket.",
      inputSchema: PlacesInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleSearchPlaces(args)
  );

  server.registerTool(
    "clickbus_search_trips_v5",
    {
      title: "Search ClickBus trips v5",
      description: "Read-only GET /api/v5/trips (JSON 200). Does not book.",
      inputSchema: TripsInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleSearchTripsV5(args)
  );

  server.registerTool(
    "clickbus_price_preview",
    {
      title: "ClickBus price/tax preview",
      description: "Prices and installments from live GET /api/v4/trips. Dedicated preview URL 404/405.",
      inputSchema: TripsInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handlePricePreview(args)
  );

  server.registerTool(
    "clickbus_boarding_points",
    {
      title: "ClickBus boarding points",
      description: "Terminals from live trip JSON. Dedicated boarding URLs 404/500.",
      inputSchema: TripsInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleBoardingPoints(args)
  );

  server.registerTool(
    "clickbus_seat_availability",
    {
      title: "ClickBus seat counts",
      description: "availableSeats/totalSeats from live trip JSON. Full seat map HTTP 500 is an honest gap.",
      inputSchema: TripsInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleSeatAvailability(args)
  );

  server.registerTool(
    "clickbus_search_trips",
    {
      title: "Search ClickBus trips and prices",
      description: "Read-only trip search on /api/v4/trips. Does not book. GPS/street redacted.",
      inputSchema: TripsInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleSearchTrips(args)
  );

  server.registerTool(
    "clickbus_booking_history",
    {
      title: "ClickBus booking history",
      description: "Past consumer bookings. Read-only. Street/phone/GPS redacted.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleBookingHistory(args)
  );

  server.registerTool(
    "clickbus_track_booking",
    {
      title: "Track a ClickBus booking",
      description: "Status only. Does not return GPS polylines or passenger documents.",
      inputSchema: BookingIdInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleTrackBooking(args)
  );

  server.registerTool(
    "clickbus_book",
    {
      title: "Book a ClickBus ticket (gated)",
      description:
        "Fail-closed. Needs CLICKBUS_ALLOW_MUTATIONS and explicit_user_intent. Guest tokens cannot charge. Default examples never enable this.",
      inputSchema: BookInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleBook(args)
  );

  server.registerTool(
    "clickbus_cancel",
    {
      title: "Cancel a ClickBus booking (gated)",
      description: "Fail-closed. Needs CLICKBUS_ALLOW_MUTATIONS and explicit_user_intent. Guest tokens cannot charge.",
      inputSchema: CancelBookingInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleCancelBooking(args)
  );

  server.registerTool(
    "clickbus_logout",
    {
      title: "Clear local ClickBus token",
      description: "Deletes ~/.clickbus-mcp/tokens.json. Requires explicit_user_intent.",
      inputSchema: LogoutInputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
    },
    async (args) => handleLogout(args)
  );
}
