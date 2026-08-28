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
  handleBook,
  handleBookingHistory,
  handleCancelBooking,
  handleCapabilities,
  handleConnectionStatus,
  handleLogout,
  handlePrivacyAudit,
  handleSearchPlaces,
  handleSearchTrips,
  handleTrackBooking
} from "../services/handlers.js";

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
