import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
  role: z.enum(["CLIENT", "OWNER"]).optional().default("CLIENT"),
  ownerSecret: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "register", 3, 60 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    const { name, email, phone, password, role, ownerSecret } = parsed.data;

    // Protection anti-élévation de privilèges : validation stricte du rôle OWNER
    if (role === "OWNER") {
      const configuredSecret = process.env.OWNER_REGISTRATION_SECRET;
      if (!configuredSecret || !ownerSecret || ownerSecret.trim() !== configuredSecret.trim()) {
        return NextResponse.json(
          { error: "Code d'activation gérant requis ou invalide. Contactez l'administrateur de la plateforme." },
          { status: 403 }
        );
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: role === "OWNER" ? "OWNER" : "CLIENT",
      },
      select: { id: true, name: true, email: true, role: true, phone: true, image: true },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = signToken(payload);

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
