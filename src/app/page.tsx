import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSession();

  if (user) {
    if (user.role === "OWNER") {
      redirect("/owner/dashboard");
    } else if (user.role === "BARBER") {
      redirect("/barber/dashboard");
    } else {
      // CLIENT — redirect straight to the unique shop
      const shop = await prisma.shop.findFirst({
        where: { isAvailable: true },
        select: { id: true },
      });
      if (shop) {
        redirect(`/client/shops/${shop.id}`);
      }
      redirect("/client/search");
    }
  }

  redirect("/auth/login");
}
