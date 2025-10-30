import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// 🧩 Interface alinhada ao schema atual
interface PostsBody {
  id?: string;
  title: string;
  weight: number;
  sold?: number;
  price: number;
  sellPrice?: number;
  isActive?: boolean;
  categoryId?: string;
  userId: string;
  parts?: { name: string; weight: number; price?: number; sellPrice?: number; isActive?: boolean }[];
}

// 🟢 GET – busca posts de um usuário
export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  if (!userId) return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });

  try {
    const posts = await db.post.findMany({
      where: { userId },
      include: { category: true, parts: true },
    });
    return NextResponse.json(posts ?? []);
  } catch (error) {
    console.error("❌ Erro ao buscar posts:", error);
    return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 });
  }
}

// 🔴 DELETE – deleta um post (e automaticamente suas parts)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const deleted = await db.post.delete({ where: { id } });
    return NextResponse.json({ message: "Item deletado com sucesso", deleted });
  } catch (error) {
    console.error("❌ Erro ao deletar Item:", error);
    return NextResponse.json({ error: "Erro ao deletar Item" }, { status: 500 });
  }
}

// 🟠 PUT – atualiza um post existente
export async function PUT(req: NextRequest) {
  try {
    const body: PostsBody = await req.json();
    const { id, title, weight, sold, price, sellPrice, categoryId, userId, parts } = body;

    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const existing = await db.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

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
        // 🔹 Adiciona as partes se existirem (substituindo as antigas se necessário)
        parts: parts
          ? {
              deleteMany: {}, // remove as antigas antes
              create: parts.map((p) => ({
                name: p.name,
                weight: p.weight,
                price: p.price ?? 0,
                sellPrice: p.sellPrice ?? 0,
                isActive: p.isActive ?? true,
              })),
            }
          : undefined,
      },
      include: { category: true, parts: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("❌ Erro ao atualizar item:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar item" }, { status: 500 });
  }
}

// 🟢 POST – cria um post com parts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, price, categoryId, sellPrice, isActive, userId, weight, parts = [] } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    if (!title || !price || !weight) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const data: any = {
      title,
      price: parseFloat(price),
      weight: parseFloat(weight),
      sellPrice: parseFloat(sellPrice) || 0,
      isActive: isActive ?? true,
      user: { connect: { id: userId } },
      parts: {
        create: parts.map((p: any) => ({
          name: p.name,
          weight: p.weight ?? 0,
          price: p.price ?? 0,
          sellPrice: p.sellPrice ?? 0,
          isActive: p.isActive ?? true,
        })),
      },
    };

    if (categoryId) {
      data.category = { connect: { id: categoryId } };
    }

    const newPost = await db.post.create({
      data,
      include: { category: true, parts: true },
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("Erro ao criar post:", error);
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}
