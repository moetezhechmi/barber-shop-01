import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    
    // Get extension
    let ext = "jpg";
    if (file instanceof File) {
      const nameParts = file.name.split(".");
      if (nameParts.length > 1) {
        ext = nameParts[nameParts.length - 1];
      }
    }
    const filename = `upload-${uniqueSuffix}.${ext}`;
    
    const publicDir = join(process.cwd(), "public");
    const uploadDir = join(publicDir, "uploads");
    
    // Ensure directories exist
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    
    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Échec du téléchargement du fichier" },
      { status: 500 }
    );
  }
}
