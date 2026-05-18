import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        shop: { isAvailable: true },
      },
      include: {
        shop: {
          select: {
            name: true,
            address: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error in GET /api/promotions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
