import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  barberId: z.string().min(1),
  shopId: z.string().min(1),
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const barberId = searchParams.get("barberId");

    const where: Record<string, unknown> = {};
    if (shopId) where.shopId = shopId;
    if (barberId) where.barberId = barberId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, image: true } },
        barber: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can create reviews" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parsed.data.appointmentId },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.clientId !== user.id) {
      return NextResponse.json({ error: "You can only review your own appointments" }, { status: 403 });
    }
    if (appointment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Can only review completed appointments" }, { status: 400 });
    }

    const existingReview = await prisma.review.findUnique({
      where: { appointmentId: parsed.data.appointmentId },
    });
    if (existingReview) {
      return NextResponse.json({ error: "Appointment already has a review" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: { ...parsed.data, clientId: user.id },
      include: {
        client: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
