export const DEFAULT_PLUMBING_SERVICES = [
  {
    slug: "plombier-service-urgent",
    name: "Service urgent",
    description:
      "Un problème urgent de plomberie ? Décrivez votre besoin pour préparer l’intervention.",
    category: "urgence",
  },
  {
    slug: "reparation-fuite",
    name: "Réparation de fuite",
    description:
      "Réparation des fuites d’eau sur les équipements et raccordements de plomberie.",
    category: "reparation",
  },
  {
    slug: "debouchage",
    name: "Débouchage",
    description: "Débouchage des éviers, lavabos, WC et canalisations.",
    category: "reparation",
  },
  {
    slug: "reparation-wc",
    name: "Réparation de WC",
    description:
      "Réparation des chasses d’eau, mécanismes et équipements de WC.",
    category: "reparation",
  },
  {
    slug: "remplacement-robinet",
    name: "Remplacement de robinet",
    description: "Remplacement d’un robinet ou d’un mitigeur existant.",
    category: "installation",
  },
  {
    slug: "reparation-chauffe-eau",
    name: "Réparation de chauffe-eau",
    description:
      "Diagnostic et réparation d’un chauffe-eau ou d’un ballon d’eau chaude.",
    category: "reparation",
  },
  {
    slug: "autre",
    name: "Autre / plomberie générale",
    description:
      "Un autre besoin de plomberie ? Décrivez votre projet à l’artisan.",
    category: "autre",
  },
] as const;
