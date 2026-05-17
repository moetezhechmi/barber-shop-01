import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    // Verify permissions
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!barber) return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    if (barber.userId !== user.id && barber.shop?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { date, startTime, endTime } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const block = await prisma.timeSlot.create({
      data: {
        barberId: id,
        date,
        startTime,
        endTime,
        isBooked: true, // true means blocked
      }
    });

    return NextResponse.json({ block });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    
    const url = new URL(req.url);
    const blockId = url.searchParams.get("blockId");
    if (!blockId) return NextResponse.json({ error: "Missing blockId" }, { status: 400 });

    const block = await prisma.timeSlot.findUnique({ where: { id: blockId } });
    if (!block) return NextResponse.json({ error: "Block not found" }, { status: 404 });

    // Verify permissions
    const barber = await prisma.barber.findUnique({
      where: { id: block.barberId },
      include: { shop: true },
    });
    if (barber?.userId !== user.id && barber?.shop?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.timeSlot.delete({ where: { id: blockId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
