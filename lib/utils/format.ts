export function formatPrice(cents: number | null): string {
  if (cents == null) return "Sur devis";
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatRating(rating: number): string {
  return rating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * business_address sometimes already contains a full address (its own
 * postcode and city baked in) rather than just a street line — appending
 * business_postcode/business_city unconditionally in that case produces a
 * nonsensical double address. Detect a full address by the presence of a
 * 5-digit French postcode inside it.
 */
export function formatAddress(
  address: string | null,
  postcode: string | null,
  city: string | null
): string {
  if (!address) return [postcode, city].filter(Boolean).join(" ");
  if (/\b\d{5}\b/.test(address)) return address;
  return [address, postcode, city].filter(Boolean).join(", ");
}
