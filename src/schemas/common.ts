import { z } from "zod";

export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown");
export const PrivacyModeSchema = z.enum(["summary", "structured", "raw"]).optional();

const Intent = z
  .boolean()
  .default(false)
  .describe("Must be true after the user explicitly asked for this write.");

export const ResponseOnlyInputSchema = z
  .object({
    response_format: ResponseFormatSchema
  })
  .strict();

export const ReadInputSchema = z
  .object({
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const PlacesInputSchema = z
  .object({
    query: z.string().min(1),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const TripsInputSchema = z
  .object({
    from: z.string().min(1).describe("Origin slug, e.g. sao-paulo-sp-todos"),
    to: z.string().min(1).describe("Destination slug, e.g. rio-de-janeiro-rj-todos"),
    departure_date: z.string().min(8).describe("YYYY-MM-DD"),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const BookingIdInputSchema = z
  .object({
    booking_id: z.string().min(1),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const LogoutInputSchema = z
  .object({
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();

export const BookInputSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    departure_date: z.string().min(8),
    trip_id: z.string().min(1).optional(),
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CancelBookingInputSchema = z
  .object({
    booking_id: z.string().min(1),
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();
