export function findProfileCity<T extends { id: string; name: string }>(cities: T[], name: string | null) {
  const normalized = name?.trim().toLocaleLowerCase("fr");
  return cities.find(city => city.name.trim().toLocaleLowerCase("fr") === normalized);
}
