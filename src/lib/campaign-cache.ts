import { revalidateTag } from "next/cache";

/**
 * Expires the cached public donation call lists right away, so the admin who
 * just created, edited or deleted a call sees the change on the next refresh
 * instead of a stale copy (which is what the "max" profile would serve).
 */
export function expireCampaignCaches() {
  revalidateTag("campaigns-published", { expire: 0 });
  revalidateTag("campaigns-clothes-published", { expire: 0 });
}
