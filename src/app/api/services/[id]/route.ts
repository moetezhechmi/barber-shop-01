import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1, "Le nom du service est requis").optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive("Le prix doit être positif").optional(),
  duration: z.number().int().positive("La durée doit être un entier positif (minutes)").optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: { shop: { select: { id: true, name: true, ownerId: true } } },
    });

    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // BOLA check: Verify service exists and belongs to the owner's salon
    const existing = await prisma.service.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    if (existing.shop.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Accès refusé. Cette prestation n'appartient pas à votre salon." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const updated = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ service: updated });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Erreur lors de la modification de la prestation" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // BOLA check: Verify service exists and belongs to the owner's salon
    const existing = await prisma.service.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    if (existing.shop.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Accès refusé. Cette prestation n'appartient pas à votre salon." },
        { status: 403 }
      );
    }

    // Check for associated appointments to prevent foreign key integrity violation
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId: id },
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer ce service car il est associé à des rendez-vous existants." },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de la prestation" }, { status: 500 });
  }
}
