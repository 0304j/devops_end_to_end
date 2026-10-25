import type { BookingRequest } from "./schema";

/** Result of submitting the booking form, as returned by the Server Action. */
export type BookingSubmitState =
  | { status: "idle" }
  | { status: "success"; request: BookingRequest }
  | { status: "error"; message: string };
