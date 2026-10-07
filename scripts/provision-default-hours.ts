import { createProvisioningClient } from "../lib/professional/provision-plumbing-services";
import { provisionDefaultHours } from "../lib/professional/provision-default-hours";

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("[working hours] Skipped outside production deployment.");
    return;
  }
  const result = await provisionDefaultHours(createProvisioningClient());
  console.log(`[working hours] Initialized ${result.initialized} artisans: 10:00–20:00, seven days. Preserved ${result.skipped} previously initialized calendars.`);
}
main().catch(() => {
  console.error("[working hours] Initialization failed. Production build stopped.");
  process.exitCode = 1;
});
