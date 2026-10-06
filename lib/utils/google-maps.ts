export function googleMapsBusinessUrl(companyName: string, address: string) {
  const query = [companyName.trim().slice(0, 300), address.trim().slice(0, 500)]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
