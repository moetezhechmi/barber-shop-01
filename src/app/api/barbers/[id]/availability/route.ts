import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const setSchema = z.object({
  workingHours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      isAvailable: z.boolean().optional().default(true),
    })
  ),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date query parameter is required" }, { status: 400 });
    }

    const dateObj = new Date(date + "T00:00:00");
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const dayOfWeek = dateObj.getDay();

    const barber = await prisma.barber.findUnique({
      where: { id },
      select: { shopId: true },
    });
    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }

    let wh = await prisma.workingHours.findFirst({
      where: { barberId: id, dayOfWeek, isAvailable: true },
    });

    if (!wh && barber.shopId) {
      wh = await prisma.workingHours.findFirst({
        where: { shopId: barber.shopId, barberId: null, dayOfWeek, isAvailable: true },
      });
    }

    if (!wh) {
      return NextResponse.json({ slots: [] });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: id,
        date,
        status: { notIn: ["CANCELLED"] },
      },
      select: { startTime: true, endTime: true },
    });

    const timeSlots = await prisma.timeSlot.findMany({
      where: { barberId: id, date, isBooked: true },
      select: { startTime: true, endTime: true },
    });

    const [whStartH, whStartM] = wh.startTime.split(":").map(Number);
    const [whEndH, whEndM] = wh.endTime.split(":").map(Number);
    const whStart = whStartH * 60 + whStartM;
    const whEnd = whEndH * 60 + whEndM;

    const bookedRanges = [
      ...appointments.map((a) => {
        const [sH, sM] = a.startTime.split(":").map(Number);
        const [eH, eM] = a.endTime.split(":").map(Number);
        return { start: sH * 60 + sM, end: eH * 60 + eM };
      }),
      ...timeSlots.map((ts) => {
        const [sH, sM] = ts.startTime.split(":").map(Number);
        const [eH, eM] = ts.endTime.split(":").map(Number);
        return { start: sH * 60 + sM, end: eH * 60 + eM };
      })
    ];

    const slots: string[] = [];
    for (let m = whStart; m + 30 <= whEnd; m += 30) {
      const slotStart = m;
      const slotEnd = m + 30;
      const isBooked = bookedRanges.some(
        (b) => slotStart < b.end && slotEnd > b.start
      );
      if (!isBooked) {
        const sh = String(Math.floor(slotStart / 60)).padStart(2, "0");
        const sm = String(slotStart % 60).padStart(2, "0");
        slots.push(`${sh}:${sm}`);
      }
    }

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await req.json();
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.workingHours.deleteMany({
      where: { barberId: id },
    });

    const created = await prisma.workingHours.createMany({
      data: parsed.data.workingHours.map((w) => ({
        ...w,
        barberId: id,
        shopId: barber.shopId,
      })),
    });

    return NextResponse.json({ workingHours: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
