import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Sanitize filename and create unique timestamped name
    const timestamp = Date.now();
    const cleanName = (file.name || "upload.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFilename = `${timestamp}-${cleanName}`;

    // 1. Try Vercel Blob if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(uniqueFilename, file, { access: "public" });
        return NextResponse.json({ url: blob.url }, { status: 200 });
      } catch (blobErr) {
        console.warn("Vercel Blob failed, falling back to local upload:", blobErr);
      }
    }

    // 2. Fallback: Save directly to /public/uploads/ (works seamlessly in localhost & VPS)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;
    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Échec du téléchargement du fichier" },
      { status: 500 }
    );
  }
}
