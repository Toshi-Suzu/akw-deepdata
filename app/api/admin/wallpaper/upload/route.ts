import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function extFromName(name: string) {
  const i = name.lastIndexOf(".");
  if (i < 0) return "jpg";
  return name.slice(i + 1).toLowerCase();
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") || "").trim();
    const adminToken = (process.env.ADMIN_TOKEN || "").trim();

    if (adminToken && token !== adminToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "image file only" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });
    }

    const ext = extFromName(file.name);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 8);
    const fileName = `wallpaper_${stamp}_${random}.${ext}`;
    const path = `wallpapers/${fileName}`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("deepdata-assets")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: settingError } = await supabase.from("app_settings").upsert({
      setting_key: "thankyou_wallpaper_path",
      setting_value: path,
    });

    if (settingError) {
      return NextResponse.json({ error: settingError.message }, { status: 500 });
    }

    const publicUrl =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/deepdata-assets/${path}`;

    return NextResponse.json({
      ok: true,
      path,
      url: publicUrl,
      fileName,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "bad request" },
      { status: 400 }
    );
  }
}