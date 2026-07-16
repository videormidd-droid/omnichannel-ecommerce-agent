// app/api/forms/submit/route.ts
// যেকোনো master_forms-ভিত্তিক ফর্মের সাবমিশন এখানে জমা হয়
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { formId, orderId, data } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { error } = await admin.from("submissions").insert({
    form_id: formId,
    order_id: orderId ?? null,
    reseller_id: user?.id ?? null,
    user_data: data,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
