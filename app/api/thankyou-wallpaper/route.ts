import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env is missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "thankyou_wallpaper_path")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const path = data.setting_value;

    const url =
      `${supabaseUrl}/storage/v1/object/public/deepdata-assets/${path}`;

    const fileName = path.split("/").pop();

    return NextResponse.json({
      ok: true,
      path,
      url,
      fileName,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? "unknown error" },
      { status: 500 }
    );
  }
}