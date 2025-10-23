import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";
import FloatingCalculator from "_components/FloatingCalculator";



export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <DashboardClient user={session.user} />
      <FloatingCalculator />
      
    </main>
  );
}
