import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// ➕ Criar nova parte
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newPart = await db.part.create({
      data: {
        name: body.name,
        weight: body.weight,
        price: body.price,
        sellPrice: body.sellPrice,
        postId: body.postId,
        sold: 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(newPart);
  } catch (error) {
    console.error("Erro ao criar parte:", error);
    return NextResponse.json(
      { error: "Erro ao criar parte" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const parts = await db.part.findMany({
      include: {
        post: {
          select: { id: true, title: true, userId: true, category: { select: { id: true, name: true, special: true }} }, // 🔹 incluir userId
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mapear para trazer userId direto no objeto
    const mappedParts = parts.map((part) => ({
      ...part,
      userId: part.post.userId,
      postTitle: part.post.title,
      category: part.post.category,
    }));

    return NextResponse.json(mappedParts);
  } catch (error) {
    console.error("Erro ao buscar partes:", error);
    return NextResponse.json({ error: "Erro ao buscar partes" }, { status: 500 });
  }
}

