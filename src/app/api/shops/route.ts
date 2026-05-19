import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  address: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  image: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";

    // Only OWNER can see all shops; clients and anonymous users only see available ones
    let where: any = (user && user.role === "OWNER") ? {} : { isAvailable: true };

    let barbers: any[] = [];
    if (q) {
      where = {
        ...where,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { services: { some: { name: { contains: q, mode: 'insensitive' } } } },
          { barbers: { some: { user: { name: { contains: q, mode: 'insensitive' } } } } },
          { promotions: { some: { title: { contains: q, mode: 'insensitive' } } } },
        ]
      };

      barbers = await prisma.barber.findMany({
        where: {
          isApproved: true,
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { bio: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: {
          user: { select: { name: true, image: true } },
          shop: { select: { id: true, name: true, address: true } },
          reviews: { select: { rating: true } }
        }
      });
    }

    const shops = await prisma.shop.findMany({
      where,
      include: {
        _count: { select: { barbers: true } },
      },
    });
    return NextResponse.json({ shops, barbers });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingShop = await prisma.shop.findFirst({ where: { ownerId: user.id } });
    if (existingShop) {
      return NextResponse.json({ error: "You already have a shop. Only one shop is allowed." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const shop = await prisma.shop.create({
      data: { ...parsed.data, ownerId: user.id },
    });

    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/shops:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
