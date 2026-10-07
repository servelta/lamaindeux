export function standardServices(trade: string) {
 const plumbing = trade === "plombier";
 const scope = plumbing ? "Fuites, débouchage, WC, robinetterie, chauffe-eau, installation et plomberie générale." : trade === "electricien" ? "Pannes, prises, éclairage, tableau électrique, installation et travaux électriques." : "Dépannage, réparation, installation et travaux adaptés à votre besoin.";
 return [
  {slug:trade+"-service-urgent",name:"Service urgent",description:"Un dépannage à organiser rapidement : "+scope+" Disponibilité à confirmer avec l’artisan.",category:"urgence"},
  {slug:trade+"-intervention-classique",name:"Intervention classique",description:scope+" Décrivez votre projet pour obtenir un devis adapté.",category:"general"},
 ] as const;
}
export const DEFAULT_PLUMBING_SERVICES = standardServices("plombier");
