import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 最低限のバリデーション（荒らし対策の入口）
    const allowedAge = ["10代", "20代", "30代", "40代", "50代", "60代+"];
    if (!allowedAge.includes(body.age_band)) {
      return NextResponse.json({ error: "invalid age_band" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("responses").insert({
      staff_email: null, // 匿名なのでnull
      age_band: body.age_band,
      gender: body.gender,
      companion_type: body.companion_type,
      motive: body.motive,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}