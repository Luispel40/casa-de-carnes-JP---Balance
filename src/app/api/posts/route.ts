import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, price, categoryId, sellPrice, isActive, userId, weight } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // ✅ Monta o objeto dinamicamente
    const data: any = {
      title,
      price: parseFloat(price),
      weight: parseFloat(weight),
      sellPrice: parseFloat(sellPrice),
      isActive,
      user: { connect: { id: userId } },
    };

    // ✅ Só adiciona se houver categoria
    if (categoryId) {
      data.category = { connect: { id: categoryId } };
    }

    const newPost = await db.post.create({
      data,
      include: { category: true },
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("Erro ao criar post:", error);
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}
