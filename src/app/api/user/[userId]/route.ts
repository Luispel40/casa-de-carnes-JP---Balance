import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { userId: string } } // ✅ aqui não precisa Promise
) {
  const { userId } = context.params; // pegue direto

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { posts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 });
  }
}
