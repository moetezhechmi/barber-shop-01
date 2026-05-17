import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateSchema = z.object({
  bio: z.string().optional(),
  isApproved: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, phone: true } },
        shop: { select: { id: true, name: true } },
        workingHours: true,
        appointments: {
          where: {
            date: { gte: new Date().toISOString().split("T")[0] },
            status: { not: "CANCELLED" },
          },
          orderBy: { date: "asc" },
          take: 10,
        },
      },
    });
    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }
    return NextResponse.json({ barber });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }

    const isOwner = barber.shop?.ownerId === user.id;
    const isBarber = barber.userId === user.id;
    if (!isOwner && !isBarber) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isOwner && !isBarber) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.barber.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ barber: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }
    if (barber.shop?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.barber.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
