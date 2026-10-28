import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Le nom du produit est requis"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être positif"),
  stock: z.number().int().min(0).default(0),
  image: z.string().optional(),
  category: z.string().default("Soins"),
  isAvailable: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const shopId = searchParams.get("shopId");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (shopId) {
      where.shopId = shopId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des produits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Aucun salon associé" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Données invalides" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du produit" }, { status: 500 });
  }
}
