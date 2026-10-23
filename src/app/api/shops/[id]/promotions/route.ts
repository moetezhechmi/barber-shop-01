import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const promotionSchema = z.object({
  title: z.string().min(1, "Le titre de l'offre est obligatoire"),
  description: z.string().optional().nullable(),
  discount: z.number().min(1).max(100, "Le pourcentage de remise doit être entre 1 et 100"),
  startDate: z.string().min(1, "La date de début est obligatoire"),
  endDate: z.string().min(1, "La date de fin est obligatoire"),
  imageUrl: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: shopId } = await params;
    
    let promotions = await prisma.promotion.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });

    if (promotions.length === 0) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
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

        const samplePromo = await prisma.promotion.create({
          data: {
            shopId,
            title: "Offre Spéciale -20%",
            description: "Profitez de 20% de réduction immédiate sur toutes les prestations !",
            discount: 20,
            startDate: todayStr,
            endDate: futureStr,
            isActive: true,
          },
        });
        promotions = [samplePromo];
      }
    }
    
    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error in GET /api/shops/[id]/promotions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shopId } = await params;
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found or unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = promotionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, description, discount, startDate, endDate, imageUrl } = parsed.data;

    // Create the promotion in the DB
    const promotion = await prisma.promotion.create({
      data: {
        shopId,
        title,
        description,
        discount,
        startDate,
        endDate,
        imageUrl,
      },
    });

    // Notify all CLIENT users in bulk
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true },
    });

    if (clients.length > 0) {
      await prisma.notification.createMany({
        data: clients.map((client) => ({
          userId: client.id,
          message: `🎉 Nouvelle Offre ! -${discount}% chez "${shop.name}" : "${title}" jusqu'au ${endDate}. Réservez votre séance maintenant !`,
          type: "PROMOTION",
        })),
      });
    }

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/shops/[id]/promotions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
