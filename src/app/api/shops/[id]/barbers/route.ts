import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const addSchema = z.object({
  email: z.string().email(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
      where: { shopId: id },
      include: {
        user: { select: userSelect as any },
      },
    });
    return NextResponse.json({ barbers });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }
    if (shop.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const barberUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!barberUser) {
      return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
    }
    if (barberUser.role !== "BARBER") {
      return NextResponse.json({ error: "User must have role BARBER" }, { status: 400 });
    }

    const existing = await prisma.barber.findUnique({ where: { userId: barberUser.id } });
    if (existing) {
      return NextResponse.json({ error: "User is already a barber at a shop" }, { status: 409 });
    }

    const barber = await prisma.barber.create({
      data: { userId: barberUser.id, shopId: id, isApproved: true },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
