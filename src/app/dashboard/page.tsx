import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./dashboard-client";
import CardItem from "./card";



export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <p>Você precisa estar logado.</p>;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <DashboardClient user={session.user} />
      <CardItem userId={session.user.id} selected="posts" />
    </main>
  );
}
