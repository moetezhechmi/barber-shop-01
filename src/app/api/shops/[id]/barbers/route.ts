import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

const addSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  bio: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getSession();
    const isOwnerOrBarber = session && (session.role === "OWNER" || session.role === "BARBER");

    const userSelect: Record<string, boolean> = {
      id: true,
      name: true,
      image: true,
    };

    if (isOwnerOrBarber) {
      userSelect.email = true;
      userSelect.phone = true;
    }

    const barbers = await prisma.barber.findMany({
      where: { shopId: id },
      include: {
        user: { select: userSelect as any },
      },
    });
    return NextResponse.json({ barbers });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé. Accès réservé aux propriétaires." }, { status: 401 });
    }

    const { id } = await params;
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
    }
    if (shop.ownerId !== user.id) {
      return NextResponse.json({ error: "Accès refusé. Vous n'êtes pas le propriétaire de ce salon." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, phone, bio } = parsed.data;

    // Check if email already in use
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Un compte avec cette adresse e-mail existe déjà." }, { status: 409 });
    }

    // Generate a secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "B!";
    const hashedPassword = await hashPassword(tempPassword);

    // Create the User with BARBER role
    const barberUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "BARBER",
      },
    });

    // Create the Barber profile
    const barber = await prisma.barber.create({
      data: {
        userId: barberUser.id,
        shopId: id,
        bio: bio || null,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
    });

    // Format WhatsApp message with credentials
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    // Default prefix to Tunisia (+216) if no plus sign exists and it has 8 digits, otherwise just keep as is
    const formattedPhone = cleanPhone.startsWith("+") 
      ? cleanPhone 
      : cleanPhone.length === 8 
        ? `+216${cleanPhone}` 
        : cleanPhone;

    const messageText = `Bonjour ${name} ! 💈\n\nVotre compte de Barbier a été créé avec succès par le gérant du salon *${shop.name}*.\n\nVoici vos accès pour vous connecter :\n📧 *Email* : ${email}\n🔑 *Mot de passe* : ${tempPassword}\n\nConnectez-vous sur : ${baseUrl}/auth/login\n\nBienvenue dans l'équipe ! 🚀`;

    const whatsappUrl = `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({
      barber,
      credentials: {
        email,
        password: tempPassword,
        phone,
      },
      whatsappUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating barber:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
