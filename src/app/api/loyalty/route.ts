import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const STAMPS_GOAL = 9; // 9 RDV → le 10e offert

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const card = await prisma.loyaltyCard.findUnique({
      where: { clientId: user.id },
    });

    const cardData = card ?? { stamps: 0, totalEarned: 0, cardsCompleted: 0 };
    return NextResponse.json({
      card: cardData,
      goal: STAMPS_GOAL,
      isFreeReady: (cardData.stamps ?? 0) >= STAMPS_GOAL,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
