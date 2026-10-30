import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ).min(1, "Le panier ne peut pas être vide"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role === "OWNER") {
      const shop = await prisma.shop.findFirst({ where: { ownerId: user.id } });
      if (!shop) return NextResponse.json({ orders: [] });

      const orders = await prisma.order.findMany({
        where: { shopId: shop.id },
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, image: true, price: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ orders });
    } else {
      // Client orders
      const orders = await prisma.order.findMany({
        where: { clientId: user.id },
        include: {
          shop: { select: { id: true, name: true, address: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, image: true, price: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ orders });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des commandes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Veuillez vous connecter pour commander" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Données invalides" }, { status: 400 });
    }

    // Fetch products to verify price and stock
    const productIds = parsed.data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Un ou plusieurs produits sont introuvables" }, { status: 400 });
    }

    // Get the shop associated with products or available shop
    const targetShopId = products[0]?.shopId;
    const shop = targetShopId
      ? await prisma.shop.findUnique({ where: { id: targetShopId } })
      : await prisma.shop.findFirst({ where: { isAvailable: true } });

    if (!shop) {
      return NextResponse.json({ error: "Salon indisponible" }, { status: 404 });
    }

    let total = 0;
    const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

    for (const item of parsed.data.items) {
      const p = products.find((prod) => prod.id === item.productId);
      if (!p) {
        return NextResponse.json({ error: "Un produit est introuvable" }, { status: 400 });
      }
      if (p.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour "${p.name}" (${p.stock} restant)` }, { status: 400 });
      }
      total += p.price * item.quantity;
      orderItemsData.push({
        productId: p.id,
        quantity: item.quantity,
        price: p.price,
      });
    }

    // Create Order and decrement stock in atomic transaction with concurrency guard
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        // 1. Decrement stocks atomically with condition: stock >= quantity
        for (const item of parsed.data.items) {
          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          // If count === 0, another concurrent transaction took the stock first
          if (updateResult.count === 0) {
            const p = products.find((prod) => prod.id === item.productId);
            throw new Error(`INSUFFICIENT_STOCK:${p?.name || item.productId}`);
          }
        }

        // 2. Create the order
        const created = await tx.order.create({
          data: {
            shopId: shop.id,
            clientId: user.id,
            total,
            notes: parsed.data.notes || null,
            status: "PENDING",
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        });

        // 3. Notify owner
        await tx.notification.create({
          data: {
            userId: shop.ownerId,
            type: "NEW_ORDER",
            message: `🛒 Nouvelle commande Click & Collect de ${user.name || "Client"} (${total.toFixed(2)} DT).`,
          },
        });

        return created;
      });
    } catch (txError) {
      if (txError instanceof Error && txError.message.startsWith("INSUFFICIENT_STOCK:")) {
        const prodName = txError.message.replace("INSUFFICIENT_STOCK:", "");
        return NextResponse.json(
          { error: `Stock insuffisant pour "${prodName}". Un autre client vient de réserver cet article.` },
          { status: 409 }
        );
      }
      throw txError;
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Erreur lors de la validation de la commande" }, { status: 500 });
  }
}
