import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { postId, soldIncrement } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "postId é obrigatório" }, { status: 400 });
    }

    if (soldIncrement !== undefined) {
      // ✅ Modo incremental (somar apenas o novo valor)
      const updatedPost = await db.post.update({
        where: { id: postId },
        data: {
          sold: { increment: Number(soldIncrement) },
        },
      });

      return NextResponse.json(updatedPost);
    }

    // 🔁 Modo de recalcular total (fallback)
    const parts = await db.part.findMany({
      where: { postId },
      select: { sold: true },
    });

    const totalSold = parts.reduce((acc, p) => acc + (p.sold || 0), 0);

    const updatedPost = await db.post.update({
      where: { id: postId },
      data: { sold: totalSold },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("❌ Erro ao atualizar sold do Post:", error);
    return NextResponse.json({ error: "Erro ao atualizar Post" }, { status: 500 });
  }
}
