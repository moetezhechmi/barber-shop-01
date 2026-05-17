import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const daySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  isAvailable: z.boolean().optional().default(true),
});

const setSchema = z.object({
  workingHours: z.array(daySchema),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allHours = await prisma.workingHours.findMany({
      where: { shopId: id },
      include: { barber: { select: { id: true, userId: true } } },
    });
    const workingHours = allHours.filter((h) => h.barberId === null);
    return NextResponse.json({ workingHours });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { workingHours } = parsed.data;

    const existing = await prisma.workingHours.findMany({
      where: { shopId: id },
    });
    const toDelete = existing.filter((h) => h.barberId === null).map((h) => h.id);
    if (toDelete.length > 0) {
      await prisma.workingHours.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    if (workingHours.some((w) => w.isAvailable)) {
      for (const w of workingHours.filter((w) => w.isAvailable)) {
        await prisma.workingHours.create({
          data: {
            barberId: null,
            shopId: id,
            dayOfWeek: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
            isAvailable: true,
          },
        });
      }
    }

    const allCreated = await prisma.workingHours.findMany({
      where: { shopId: id },
    });
    const created = allCreated.filter((h) => h.barberId === null);

    return NextResponse.json({ workingHours: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
