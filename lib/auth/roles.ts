export type UserRole = "customer" | "professional" | "admin";

/**
 * Maps a path prefix to the roles allowed to access it.
 * Checked in middleware.ts on every request. Keep this list in sync
 * with the (customer)/(professional)/(admin) route groups in /app.
 */
export const PROTECTED_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/mon-compte", roles: ["customer"] },
  { prefix: "/mes-reservations", roles: ["customer"] },
  { prefix: "/dashboard", roles: ["professional"] },
  { prefix: "/profil", roles: ["professional"] },
  { prefix: "/mes-services", roles: ["professional"] },
  { prefix: "/calendrier", roles: ["professional"] },
  { prefix: "/documents", roles: ["professional"] },
  { prefix: "/reservations", roles: ["professional"] },
  { prefix: "/admin", roles: ["admin"] },
];

export function findRouteRule(pathname: string) {
  return PROTECTED_ROUTES.find((route) => pathname.startsWith(route.prefix));
}

/** Where to send a user after login, based on their role. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "professional":
      return "/dashboard";
    case "customer":
    default:
      return "/mon-compte";
  }
}
