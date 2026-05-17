import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        barber: {
          include: { user: { select: { id: true, name: true, image: true } }, shop: true },
        },
        service: true,
        shop: { select: { id: true, name: true, address: true } },
        review: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const isClient = appointment.clientId === user.id;
    const isBarber = appointment.barber.userId === user.id;
    const isOwner = appointment.barber.shop?.ownerId === user.id;

    if (!isClient && !isBarber && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ appointment });
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
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { barber: { include: { shop: true } } },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const isClient = appointment.clientId === user.id;
    const isBarber = appointment.barber.userId === user.id;
    const isOwner = appointment.barber.shop?.ownerId === user.id;

    if (!isClient && !isBarber && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.date) data.date = parsed.data.date;
    if (parsed.data.startTime) data.startTime = parsed.data.startTime;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    if (parsed.data.status) data.status = parsed.data.status;

    const updated = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    return NextResponse.json({ appointment: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
