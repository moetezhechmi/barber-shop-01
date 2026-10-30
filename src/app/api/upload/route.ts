import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/auth";

// Maximum upload size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Validates the file's binary header (magic bytes) to guarantee
 * it is a genuine image and prevent extension spoofing / stored XSS.
 */
function validateImageMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return ".png";
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return ".webp";
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // 2. File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La taille du fichier dépasse la limite maximale autorisée (5 Mo)." },
        { status: 400 }
      );
    }

    // 3. MIME type validation
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format non pris en charge. Seules les images JPEG, PNG et WEBP sont acceptées." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Content inspection (magic bytes check) to prevent script/HTML disguise
    const verifiedExtension = validateImageMagicBytes(buffer);
    if (!verifiedExtension) {
      return NextResponse.json(
        { error: "Fichier invalide ou corrompu. Le contenu ne correspond pas à une image valide." },
        { status: 400 }
      );
    }

    // 5. Generate secure random filename (immune to path traversal)
    const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}${verifiedExtension}`;

    // 6. Try Vercel Blob if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(uniqueFilename, buffer, {
          access: "public",
          contentType: file.type,
        });
        return NextResponse.json({ url: blob.url }, { status: 200 });
      } catch (blobErr) {
        console.warn("Vercel Blob failed, falling back to local upload:", blobErr);
      }
    }

    // 7. Local storage fallback
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
