/** Splits a single "Nom complet" input into first/last name for storage. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIdx), lastName: trimmed.slice(spaceIdx + 1) };
}

/**
 * Splits a single free-text address input into the address_line/postcode/city
 * columns the bookings table (and its downstream displays) still expect.
 * Looks for a 5-digit French postcode; everything after it is the city,
 * everything before is the street line. Falls back to putting the whole
 * string in address_line when no postcode is found.
 */
export function parseAddress(address: string): { addressLine: string; postcode: string; city: string } {
  const trimmed = address.trim().replace(/\s+/g, " ");
  const match = trimmed.match(/^(.*?)[,\s]*\b(\d{5})\b\s+(.+)$/);
  if (!match) return { addressLine: trimmed, postcode: "", city: "" };
  const [, addressLine, postcode, city] = match;
  return { addressLine: addressLine.trim() || trimmed, postcode, city: city.trim() };
}
