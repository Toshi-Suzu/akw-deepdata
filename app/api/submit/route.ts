import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ALLOWED as allowed } from "@/app/questions";

function isAllowed<T extends readonly string[]>(arr: T, v: any): v is T[number] {
  return typeof v === "string" && (arr as readonly string[]).includes(v);
}

function isNonEmptyString(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!isNonEmptyString(body.respondent_id)) {
      return NextResponse.json({ error: "invalid respondent_id" }, { status: 400 });
    }

    if (!isNonEmptyString(body.visit_key) || !/^\d{4}-\d{2}-\d{2}$/.test(body.visit_key)) {
      return NextResponse.json({ error: "invalid visit_key" }, { status: 400 });
    }

    if (!isAllowed(allowed.age_band, body.age_band)) {
      return NextResponse.json({ error: "invalid age_band" }, { status: 400 });
    }

    if (!isAllowed(allowed.gender, body.gender)) {
      return NextResponse.json({ error: "invalid gender" }, { status: 400 });
    }

    if (!isAllowed(allowed.residence, body.residence)) {
      return NextResponse.json({ error: "invalid residence" }, { status: 400 });
    }

    if (!isAllowed(allowed.companion_type, body.companion_type)) {
      return NextResponse.json({ error: "invalid companion_type" }, { status: 400 });
    }

    if (!isAllowed(allowed.visit_frequency, body.visit_frequency)) {
      return NextResponse.json({ error: "invalid visit_frequency" }, { status: 400 });
    }

    if (!isAllowed(allowed.info_source, body.info_source)) {
      return NextResponse.json({ error: "invalid info_source" }, { status: 400 });
    }

    if (!isAllowed(allowed.child_with, body.child_with)) {
      return NextResponse.json({ error: "invalid child_with" }, { status: 400 });
    }

    const needsChildAge = body.child_with === "はい";

    if (needsChildAge) {
      if (!isAllowed(allowed.child_age_band, body.child_age_band)) {
        return NextResponse.json({ error: "invalid child_age_band" }, { status: 400 });
      }
    }

    // 自由回答
    if (!isNonEmptyString(body.top_expectation)) {
      return NextResponse.json({ error: "invalid top_expectation" }, { status: 400 });
    }

    const improvement_request =
      typeof body.improvement_request === "string"
        ? body.improvement_request.trim()
        : "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const row = {
      staff_email: null,
      respondent_id: body.respondent_id,
      visit_key: body.visit_key,

      source_location: body.source_location ?? "qr",
      age_band: body.age_band,
      gender: body.gender,
      residence: body.residence,
      companion_type: body.companion_type,
      visit_frequency: body.visit_frequency,
      info_source: body.info_source,

      child_with: body.child_with,
      child_age_band: needsChildAge ? body.child_age_band : null,

      top_expectation: body.top_expectation.trim(),
      improvement_request: improvement_request || null,
    };

    const { error } = await supabase
      .from("responses")
      .upsert(row, { onConflict: "respondent_id,visit_key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}