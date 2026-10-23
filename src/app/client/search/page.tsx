import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientSearchPage() {
  const shop = await prisma.shop.findFirst({
    where: { isAvailable: true },
    select: { id: true },
  });

  if (shop) {
    redirect(`/client/shops/${shop.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
      <div className="text-6xl">✂️</div>
      <h1 className="text-2xl font-bold text-gray-900">Bientôt disponible</h1>
      <p className="text-gray-500 max-w-sm">Le salon n&apos;est pas encore configuré.</p>
    </div>
  );
}
