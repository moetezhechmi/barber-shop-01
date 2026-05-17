import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  barberId: z.string().min(1),
  shopId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let appointments;
    let blocks: any[] = [];

    if (user.role === "CLIENT") {
      const where: any = { clientId: user.id };
      if (statusFilter) where.status = statusFilter;

      appointments = await prisma.appointment.findMany({
        where,
        include: {
          barber: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
          service: true,
          shop: { select: { id: true, name: true } },
          review: { select: { id: true } },
        },
        orderBy: { date: "desc" },
      });
    } else if (user.role === "BARBER") {
      const barber = await prisma.barber.findUnique({ where: { userId: user.id } });
      if (!barber) {
        return NextResponse.json({ error: "Barber profile not found" }, { status: 404 });
      }

      const where: any = { barberId: barber.id };
      if (statusFilter) where.status = statusFilter;

      appointments = await prisma.appointment.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          service: true,
          shop: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      });
    } else if (user.role === "OWNER") {
      const shops = await prisma.shop.findMany({ where: { ownerId: user.id }, select: { id: true } });
      const shopIds = shops.map((s) => s.id);

      const where: any = { shopId: { in: shopIds } };
      if (statusFilter) where.status = statusFilter;

      appointments = await prisma.appointment.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          barber: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
          service: true,
          shop: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      });

      const barbers = await prisma.barber.findMany({ where: { shopId: { in: shopIds } }, select: { id: true } });
      const barberIds = barbers.map(b => b.id);
      blocks = await prisma.timeSlot.findMany({ where: { barberId: { in: barberIds }, isBooked: true } });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ appointments, blocks });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can create appointments" }, { status: 401 });
    }

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
        clientId: user.id,
        barberId: parsed.data.barberId,
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
        barber: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Create a real-time database Notification for the Barber
    const dbBarber = await prisma.barber.findUnique({
      where: { id: parsed.data.barberId },
      select: { userId: true },
    });
    if (dbBarber) {
      await prisma.notification.create({
        data: {
          userId: dbBarber.userId,
          message: `Nouveau rendez-vous par ${user.name || user.email || "Client"} le ${parsed.data.date} à ${parsed.data.startTime} (${service.name})`,
          type: "APPOINTMENT_REQUEST",
        },
      });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
