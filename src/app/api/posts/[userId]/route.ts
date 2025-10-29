import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// 🧩 Interface corrigida e alinhada ao schema atual
interface PostsBody {
  id?: string;
  title: string;
  weight: number;
  sold?: number;
  price: number;
  sellPrice?: number;
  isActive?: boolean;
  categoryId: string;
  userId: string;
}

// 🟢 GET – busca posts de um usuário
export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const posts = await db.post.findMany({
      where: { userId },
      include: { category: true, parts: true },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("❌ Erro ao buscar posts:", error);
    return NextResponse.json(
      { error: "Erro ao buscar posts" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE – deleta um post (e automaticamente suas parts)
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id)
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    await db.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Item deletado com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao deletar Item:", error);
    return NextResponse.json(
      { error: "Erro ao deletar Item" },
      { status: 500 }
    );
  }
}

// 🟠 PUT – atualiza um post existente
export async function PUT(req: NextRequest, context: any) {
  const body: PostsBody = await req.json();
  const { id, title, weight, sold, price, sellPrice, categoryId, userId } = body;

  if (!id)
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    const existing = await db.post.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );

    const updated = await db.post.update({
      where: { id },
      data: {
        title,
        weight,
        sold,
        price,
        sellPrice,
        categoryId,
        userId,
      },
      include: { category: true, parts: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("❌ Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}
