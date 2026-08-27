/**
 * French text helpers for trade names.
 *
 * The `trades` table stores only `name` ("Électricité") and `name_singular`
 * ("Électricien") — no article, and no display plural. `slug_plural`
 * ("electriciens") is an unaccented URL slug and must never be rendered as
 * prose. These helpers derive correct prose from `name_singular` instead,
 * which matters as soon as a vowel-initial trade goes live: "le électricien"
 * and "les electriciens" both read as broken French.
 */

// Vowel-initial words take the elided form. `h` is included because French
// elides before an h muet ("l'horticulteur") — the far more common case for
// trade names. A future h-aspiré trade ("le hall...") would need an
// exception here; none exists in the catalog today.
const STARTS_WITH_VOWEL = /^[aeiouyàâäéèêëîïôöùûüh]/i;

/**
 * Prefixes a noun with a particle, applying elision:
 *   le → "le plombier"    / "l'électricien"
 *   du → "du plombier"    / "de l'électricien"
 *   de → "de plomberie"   / "d'électricité"
 */
export function withParticle(particle: "le" | "du" | "de", noun: string): string {
  const elides = STARTS_WITH_VOWEL.test(noun);
  if (particle === "le") return elides ? `l'${noun}` : `le ${noun}`;
  if (particle === "du") return elides ? `de l'${noun}` : `du ${noun}`;
  return elides ? `d'${noun}` : `de ${noun}`;
}

/**
 * Display plural of a trade name. Every trade in the catalog pluralises
 * with a plain -s (plombiers, électriciens, peintres, chauffagistes,
 * artisans); the guard just avoids doubling it on a name already plural.
 */
export function pluralise(noun: string): string {
  return noun.endsWith("s") ? noun : `${noun}s`;
}
