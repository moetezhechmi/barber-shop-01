import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const image = await prisma.galleryImage.findUnique({
      where: { id },
      include: { barber: { include: { shop: true } } },
    });
    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // BOLA check: only the barber who uploaded the image or the owner of that barber's shop can delete it
    const isBarber = image.barber.userId === user.id;
    const isOwner = user.role === "OWNER" && image.barber.shop?.ownerId === user.id;

    if (!isBarber && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.galleryImage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
