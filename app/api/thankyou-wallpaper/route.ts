import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bucket = process.env.THANKYOU_WALLPAPER_BUCKET;
    const path = process.env.THANKYOU_WALLPAPER_PATH;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env is missing" },
        { status: 500 }
      );
    }

    if (!bucket || !path) {
      return NextResponse.json(
        { ok: false, error: "Wallpaper env is missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    if (!data?.publicUrl) {
      return NextResponse.json(
        { ok: false, error: "Wallpaper URL could not be generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bucket,
      path,
      url: data.publicUrl,
      fileName: path.split("/").pop() || "wallpaper.jpg",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}