import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSession();
  if (user) {
    if (user.role === "OWNER") {
      redirect("/owner/dashboard");
    } else if (user.role === "BARBER") {
      redirect("/barber/dashboard");
    } else {
      redirect("/client/search");
    }
  }

  redirect("/auth/login");
}
