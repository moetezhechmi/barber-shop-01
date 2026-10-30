import { NextRequest, NextResponse } from "next/server";
import { broadcastToAll } from "@/app/api/sse/route";
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
    if (service.shopId !== parsed.data.shopId) {
      return NextResponse.json({ error: "Service does not belong to this shop" }, { status: 400 });
    }

    const barber = await prisma.barber.findUnique({ where: { id: parsed.data.barberId } });
    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }
    if (barber.shopId !== parsed.data.shopId) {
      return NextResponse.json({ error: "Barber does not belong to this shop" }, { status: 400 });
    }

    const [startHour, startMin] = parsed.data.startTime.split(":").map(Number);
    const slotStart = startHour * 60 + startMin;
    const slotEnd = slotStart + service.duration;
    const endHour = Math.floor(slotEnd / 60);
    const endMin = slotEnd % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // Check if client has a full loyalty card (free appointment)
    // NOTE: we only READ here — the card reset happens on COMPLETED (status/route.ts)
    // This prevents losing the free slot if the transaction fails or the RDV gets cancelled.
    const loyaltyCard = await prisma.loyaltyCard.findUnique({
      where: { clientId: user.id },
    });
    const isFreeAppointment = (loyaltyCard?.stamps ?? 0) >= 9;
    const loyaltyNote = isFreeAppointment ? "[GRATUIT - Carte de fidelite]" : "";
    const finalNotes = [loyaltyNote, parsed.data.notes].filter(Boolean).join(" | ") || undefined;

    // Atomic transaction: verify slot interval overlap + blocked slots + create
    let appointment;
    try {
      appointment = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch active appointments for the barber on that date
        const existingAppointments = await tx.appointment.findMany({
          where: {
            barberId: parsed.data.barberId,
            date: parsed.data.date,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          select: { startTime: true, endTime: true },
        });

        // 2. Fetch blocked slots for the barber on that date
        const blockedSlots = await tx.timeSlot.findMany({
          where: {
            barberId: parsed.data.barberId,
            date: parsed.data.date,
            isBooked: true,
          },
          select: { startTime: true, endTime: true },
        });

        // 3. Check for any overlapping busy interval: slotStart < busyEnd && slotEnd > busyStart
        const bookedRanges = [
          ...existingAppointments.map((a) => {
            const [sH, sM] = a.startTime.split(":").map(Number);
            const [eH, eM] = a.endTime.split(":").map(Number);
            return { start: sH * 60 + sM, end: eH * 60 + eM };
          }),
          ...blockedSlots.map((ts) => {
            const [sH, sM] = ts.startTime.split(":").map(Number);
            const [eH, eM] = ts.endTime.split(":").map(Number);
            return { start: sH * 60 + sM, end: eH * 60 + eM };
          }),
        ];

        const hasConflict = bookedRanges.some(
          (b) => slotStart < b.end && slotEnd > b.start
        );

        if (hasConflict) {
          throw new Error("SLOT_TAKEN");
        }

        return tx.appointment.create({
          data: {
            clientId: user.id,
            barberId: parsed.data.barberId,
            shopId: parsed.data.shopId,
            serviceId: parsed.data.serviceId,
            date: parsed.data.date,
            startTime: parsed.data.startTime,
            endTime,
            notes: finalNotes,
          },
          include: {
            client: { select: { id: true, name: true, email: true } },
            service: true,
            barber: { include: { user: { select: { id: true, name: true } } } },
          },
        });
      },
      { isolationLevel: "Serializable" }
    );
    } catch (txError) {
      if (txError instanceof Error && txError.message === "SLOT_TAKEN") {
        return NextResponse.json(
          { error: "Ce créneau horaire chevauche un rendez-vous existant ou une indisponibilité. Veuillez choisir un autre horaire." },
          { status: 409 }
        );
      }
      throw txError;
    }

    // Broadcast slots_updated so all clients refresh availability
    broadcastToAll("slots_updated", { barberId: parsed.data.barberId, date: parsed.data.date });
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
