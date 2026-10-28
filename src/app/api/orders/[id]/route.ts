import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["PENDING", "READY", "COMPLETED", "CANCELLED"]),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    // Notify client based on status
    let message = "";
    if (parsed.data.status === "READY") {
      message = `🛍️ Votre commande de produits est prête à être récupérée au salon !`;
    } else if (parsed.data.status === "COMPLETED") {
      message = `✅ Votre commande a été récupérée avec succès. Merci pour vos achats !`;
    } else if (parsed.data.status === "CANCELLED") {
      message = `❌ Votre commande a été annulée. Contactez le salon pour plus d'informations.`;
    }

    if (message) {
      await prisma.notification.create({
        data: {
          userId: order.clientId,
          type: "ORDER_STATUS",
          message,
        },
      });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour de la commande" }, { status: 500 });
  }
}
