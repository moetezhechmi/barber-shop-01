import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const where = shopId ? { shopId } : {};

    const session = await getSession();
    const isOwnerOrBarber = session && (session.role === "OWNER" || session.role === "BARBER");

    const userSelect: Record<string, boolean> = {
      id: true,
      name: true,
      image: true,
    };

    if (isOwnerOrBarber) {
      userSelect.email = true;
      userSelect.phone = true;
    }

    const barbers = await prisma.barber.findMany({
      where,
      include: {
        user: { select: userSelect as any },
        shop: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ barbers });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getSession();
    if (!user || user.role !== "BARBER") {
      return NextResponse.json({ error: "User must have role BARBER" }, { status: 401 });
    }

    const existing = await prisma.barber.findUnique({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: "Barber profile already exists" }, { status: 409 });
    }

    const barber = await prisma.barber.create({
      data: { userId: user.id, isApproved: false },
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
