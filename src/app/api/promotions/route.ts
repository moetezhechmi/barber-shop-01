import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        shop: { isAvailable: true },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            image: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If no promotions exist yet, auto-create a default offer for the first shop so the client page has demo content
    if (promotions.length === 0) {
      const shop = await prisma.shop.findFirst({
        where: { isAvailable: true },
        select: { id: true, name: true, address: true, image: true, phone: true },
      });

      if (shop) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const fYyyy = future.getFullYear();
        const fMm = String(future.getMonth() + 1).padStart(2, "0");
        const fDd = String(future.getDate()).padStart(2, "0");
        const futureStr = `${fYyyy}-${fMm}-${fDd}`;

        const defaultPromo = await prisma.promotion.create({
          data: {
            shopId: shop.id,
            title: "Pack Marié VIP 💍",
            description: "Coiffure + Barbe prestige + Soin du visage éclat + Finition premium pour le grand jour.",
            discount: 25,
            startDate: todayStr,
            endDate: futureStr,
            isActive: true,
          },
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                address: true,
                image: true,
                phone: true,
              },
            },
          },
        });

        promotions = [defaultPromo];
      }
    }

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error in GET /api/promotions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
