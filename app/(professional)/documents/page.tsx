import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/professional/queries";

// Keep old bookmarks working without offering document collection.
export default async function DocumentsPage() {
  await requireUserId();
  redirect("/dashboard");
}
