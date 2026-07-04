import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to verify passcode
function verifyAuth(req: NextRequest) {
  const passcode = process.env.FITME_PASSCODE;
  if (!passcode) return true;
  const clientPasscode = req.headers.get("x-fitme-passcode");
  return clientPasscode === passcode;
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json(
      { ok: false, error: "Missing Supabase configuration env variables" },
      { status: 500 }
    );
  }

  try {
    const { image, ext } = await req.json();

    if (!image || !ext) {
      return Response.json({ ok: false, error: "Missing image or extension" }, { status: 400 });
    }

    // Validate extension
    const cleanExt = ext.toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(cleanExt)) {
      return Response.json({ ok: false, error: "Unsupported image format" }, { status: 400 });
    }

    // Determine MIME type
    let mimeType = "image/jpeg";
    if (cleanExt === ".png") mimeType = "image/png";
    if (cleanExt === ".webp") mimeType = "image/webp";
    if (cleanExt === ".gif") mimeType = "image/gif";

    // Clean base64 string and decode it into a buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Generate unique file path inside the bucket
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const randomHex = Math.random().toString(16).slice(2, 10);
    const filename = `${timestamp}-${randomHex}${cleanExt}`;

    // Upload to Supabase Storage bucket 'health-images'
    const { error: uploadError } = await supabase.storage
      .from("health-images")
      .upload(filename, buffer, {
        contentType: mimeType,
        cacheControl: "31536000",
        upsert: false
      });

    if (uploadError) {
      throw new Error("Supabase Storage Upload Error: " + uploadError.message);
    }

    // Get the public URL of the uploaded image
    const { data } = supabase.storage.from("health-images").getPublicUrl(filename);

    return Response.json({ ok: true, path: data.publicUrl });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

