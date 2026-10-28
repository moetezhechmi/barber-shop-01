import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    // Security check: prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "public", "uploads", safeFilename);

    const fileBuffer = await readFile(filePath);

    // Determine content type
    let contentType = "image/jpeg";
    if (safeFilename.endsWith(".png")) contentType = "image/png";
    else if (safeFilename.endsWith(".webp")) contentType = "image/webp";
    else if (safeFilename.endsWith(".svg")) contentType = "image/svg+xml";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
