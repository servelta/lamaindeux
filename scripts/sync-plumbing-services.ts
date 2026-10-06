import {
  createProvisioningClient,
  provisionPlumbingServices,
} from "../lib/professional/provision-plumbing-services";

async function main() {
  // Preview and local builds never mutate the production database.
  if (process.env.VERCEL_ENV !== "production") {
    console.log("[plumbing services] Skipped outside production deployment.");
    return;
  }
  const result = await provisionPlumbingServices(createProvisioningClient());
  console.log(
    `[plumbing services] Verified ${result.plumbers} plumbers with ${result.servicesPerPlumber} standard services each.`,
  );
}

main().catch((error: unknown) => {
  console.error(
    `[plumbing services] ${error instanceof Error ? error.message : "Provisioning failed."} Production build stopped.`,
  );
  process.exitCode = 1;
});
