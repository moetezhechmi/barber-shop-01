import { NextRequest, NextResponse } from "next/server";
import { broadcastToUser, broadcastToAll } from "@/app/api/sse/route";
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
      const isBarber = appointment.barber.userId === user.id;
      const isOwner = user.role === "OWNER" && appointment.barber.shop?.ownerId === user.id;
      if (!isBarber && !isOwner) {
        return NextResponse.json({ error: "Only the barber or owner can mark as completed" }, { status: 403 });
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
      const notif = await prisma.notification.create({
        data: {
          userId: appointment.clientId,
          message: `Votre rendez-vous du ${appointment.date} à ${appointment.startTime} (${updated.service.name}) a été accepté ! 🎉`,
          type: "APPOINTMENT_ACCEPTED",
        },
      });
      broadcastToUser(appointment.clientId, "notification", { notification: notif });
    } else if (status === "CANCELLED") {
      if (user.id === appointment.clientId) {
        const notif = await prisma.notification.create({
          data: {
            userId: appointment.barber.userId,
            message: `Le rendez-vous de ${user.name || user.email || "Client"} du ${appointment.date} à ${appointment.startTime} a été annulé par le client.`,
            type: "APPOINTMENT_CANCELLED",
          },
        });
        broadcastToUser(appointment.barber.userId, "notification", { notification: notif });
      } else {
        const notif = await prisma.notification.create({
          data: {
            userId: appointment.clientId,
            message: `Votre rendez-vous du ${appointment.date} à ${appointment.startTime} (${updated.service.name}) a été annulé par l'établissement.`,
            type: "APPOINTMENT_CANCELLED",
          },
        });
        broadcastToUser(appointment.clientId, "notification", { notification: notif });
      }
    } else if (status === "COMPLETED") {
      const notif = await prisma.notification.create({
        data: {
          userId: appointment.clientId,
          message: `Votre rendez-vous du ${appointment.date} à ${appointment.startTime} (${updated.service.name}) est terminé. Merci pour votre visite ! N'hésitez pas à laisser un avis.`,
          type: "APPOINTMENT_COMPLETED",
        },
      });
      broadcastToUser(appointment.clientId, "notification", { notification: notif });

      // ── Loyalty card ──
      try {
        const STAMPS_GOAL = 9;
        const isFreeRDV = appointment.notes?.includes("[GRATUIT - Carte de fidelite]") ?? false;

        const existing = await prisma.loyaltyCard.findUnique({
          where: { clientId: appointment.clientId },
        });

        if (isFreeRDV) {
          // Free appointment: reset the card (was already full at booking time)
          if (existing) {
            await prisma.loyaltyCard.update({
              where: { clientId: appointment.clientId },
              data: { stamps: 0, cardsCompleted: { increment: 1 } },
            });
          }
        } else {
          // Normal appointment: add a stamp with deduplication
          if (existing?.lastCompletedAppointmentId !== id) {
            const currentStamps = existing?.stamps ?? 0;
            const newStamps = currentStamps + 1;
            const cardCompleted = newStamps >= STAMPS_GOAL;

            if (existing) {
              await prisma.loyaltyCard.update({
                where: { clientId: appointment.clientId },
                data: {
                  stamps: cardCompleted ? 0 : newStamps,
                  totalEarned: { increment: 1 },
                  lastCompletedAppointmentId: id,
                  ...(cardCompleted ? { cardsCompleted: { increment: 1 } } : {}),
                },
              });
            } else {
              await prisma.loyaltyCard.create({
                data: {
                  clientId: appointment.clientId,
                  stamps: cardCompleted ? 0 : newStamps,
                  totalEarned: 1,
                  cardsCompleted: cardCompleted ? 1 : 0,
                  lastCompletedAppointmentId: id,
                },
              });
            }

            const msg = cardCompleted
              ? "Votre carte de fidelite est complete. Votre prochain RDV est offert !"
              : `Tampon ${newStamps}/${STAMPS_GOAL} ajoute. Plus que ${STAMPS_GOAL - newStamps} avant une coupe offerte.`;

            await prisma.notification.create({
              data: {
                userId: appointment.clientId,
                message: msg,
                type: cardCompleted ? "LOYALTY_REWARD" : "LOYALTY_STAMP",
              },
            });
          }
        }
      } catch {
        // Loyalty errors must never block the status update
      }
    }
    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("Error in status update:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
