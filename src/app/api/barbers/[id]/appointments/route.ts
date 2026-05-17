import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  clientId: z.string().min(1),
  shopId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const isBarberSelf = barber.userId === user.id;
    const isOwner = barber.shop?.ownerId === user.id;

    if (!isBarberSelf && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = { barberId: id };
    if (status) where.status = status;
    if (date) where.date = date;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: true,
        shop: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    const blocks = await prisma.timeSlot.findMany({
      where: { barberId: id, ...(date ? { date } : {}) },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ appointments, blocks });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can create appointments" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const [startHour, startMin] = parsed.data.startTime.split(":").map(Number);
    const totalMinutes = startHour * 60 + startMin + service.duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    const appointment = await prisma.appointment.create({
      data: {
        clientId: parsed.data.clientId,
        barberId: id,
        shopId: parsed.data.shopId,
        serviceId: parsed.data.serviceId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime,
        notes: parsed.data.notes,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
