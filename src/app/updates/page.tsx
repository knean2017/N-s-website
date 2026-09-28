import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked } from "@/lib/admin-access";
import { UpdatesClient } from "./updates-client";

const getUpdates = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("updates")
      .select("id, title, details, created_at, organizations(display_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    return data;
  },
  ["updates-published"],
  { revalidate: 60 }
);

export default async function UpdatesPage() {
  // Stop prerendering here: data needs Supabase env vars, only available at request time.
  await connection();
  const [updates, adminUnlocked] = await Promise.all([
    getUpdates(),
    isAdminUnlocked(),
  ]);

  return (
    <UpdatesClient updates={updates} adminUnlocked={adminUnlocked} />
  );
}

