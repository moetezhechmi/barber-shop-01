import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

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

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status } = parsed.data;

    if (status === "CONFIRMED") {
      const isBarber = appointment.barber.userId === user.id;
      const isOwner = user.role === "OWNER" && appointment.barber.shop?.ownerId === user.id;
      if (!isBarber && !isOwner) {
        return NextResponse.json({ error: "Only the barber or owner can confirm appointments" }, { status: 403 });
      }
    } else if (status === "COMPLETED") {
      if (appointment.barber.userId !== user.id) {
        return NextResponse.json({ error: "Only the barber can mark as completed" }, { status: 403 });
      }
    } else if (status === "CANCELLED") {
      const isClient = appointment.clientId === user.id;
      const isBarber = appointment.barber.userId === user.id;
      const isOwner = user.role === "OWNER" && appointment.barber.shop?.ownerId === user.id;
      if (!isClient && !isBarber && !isOwner) {
        return NextResponse.json({ error: "Only the client, barber, or owner can cancel" }, { status: 403 });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { service: { select: { name: true } } },
    });

    // Send database notifications automatically
    if (status === "CONFIRMED") {
      await prisma.notification.create({
        data: {
          userId: appointment.clientId,
          message: `Votre rendez-vous du ${appointment.date} à ${appointment.startTime} (${updated.service.name}) a été accepté ! 🎉`,
          type: "APPOINTMENT_ACCEPTED",
        },
      });
    } else if (status === "CANCELLED") {
      if (user.id === appointment.clientId) {
        // Client cancelled, notify barber
        await prisma.notification.create({
          data: {
            userId: appointment.barber.userId,
            message: `Le rendez-vous de ${user.name || user.email || "Client"} du ${appointment.date} à ${appointment.startTime} a été annulé par le client.`,
            type: "APPOINTMENT_CANCELLED",
          },
        });
      } else {
        // Barber or Owner cancelled, notify client
        await prisma.notification.create({
          data: {
            userId: appointment.clientId,
            message: `Votre rendez-vous du ${appointment.date} à ${appointment.startTime} (${updated.service.name}) a été annulé par l'établissement.`,
            type: "APPOINTMENT_CANCELLED",
          },
        });
      }
    } else if (status === "COMPLETED") {
      await prisma.notification.create({
        data: {
          userId: appointment.clientId,
          message: `Votre rendez-vous du ${appointment.date} à ${appointment.startTime} (${updated.service.name}) est terminé. Merci pour votre visite ! N'hésitez pas à laisser un avis.`,
          type: "APPOINTMENT_COMPLETED",
        },
      });
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("Error in status update:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
