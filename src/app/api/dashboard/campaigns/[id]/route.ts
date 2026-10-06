import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApiAccess } from "@/lib/admin-access";
import { expireCampaignCaches } from "@/lib/campaign-cache";
import { formatCardNumber } from "@/lib/utils";
import { contentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;
  const supabase = createAdminClient();

  const { id } = await params;
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  expireCampaignCaches();

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const authError = await requireAdminApiAccess();
  if (authError) return authError;
  const supabase = createAdminClient();

  const { id } = await params;
  const payload = await request.json();

  // The clothes "Mark as done" button sends only is_done.
  if (payload && typeof payload === "object" && Object.keys(payload).length === 1 && "is_done" in payload) {
    const { error } = await supabase.from("campaigns").update({ is_done: Boolean(payload.is_done) }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    expireCampaignCaches();
    return NextResponse.json({ ok: true });
  }

  const { data: existing } = await supabase.from("campaigns").select("campaign_type").eq("id", id).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Donation call not found." }, { status: 404 });
  }

  const isClothes = existing.campaign_type === "clothes";
  const parsed = contentSchema.safeParse(payload);
  if (!parsed.success || (!isClothes && parsed.data.amount_needed === undefined)) {
    return NextResponse.json({ error: "Invalid campaign data." }, { status: 400 });
  }

  const { title, summary, amount_needed, image_url, contact_number, card_number } = parsed.data;
  const { error } = await supabase
    .from("campaigns")
    .update({
      title,
      summary,
      image_url: image_url || null,
      contact_number: contact_number || null,
      // Clothes calls have no funding goal or card number to edit.
      ...(isClothes ? {} : { amount_needed, card_number: formatCardNumber(card_number) }),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  expireCampaignCaches();

  return NextResponse.json({ ok: true });
}
