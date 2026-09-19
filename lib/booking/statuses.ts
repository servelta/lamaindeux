/**
 * A booking that is still live for the customer: requested, confirmed, or
 * accepted by the professional. Anything else is finished, cancelled, or
 * disputed and belongs in a history list rather than an "à venir" one.
 */
export const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "ACCEPTED"];
