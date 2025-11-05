import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// Atualiza o campo `sold` de um post baseado na soma das partes associadas
export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "postId é obrigatório" }, { status: 400 });
    }

    // Busca todas as partes do post
    const parts = await db.part.findMany({
      where: { postId },
      select: { sold: true },
    });

    // Soma total vendida
    const totalSold = parts.reduce((acc, p) => acc + (p.sold || 0), 0);

    // Atualiza o Post
    const updatedPost = await db.post.update({
      where: { id: postId },
      data: { sold: totalSold },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Erro ao atualizar sold do Post:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar Post" },
      { status: 500 }
    );
  }
}
