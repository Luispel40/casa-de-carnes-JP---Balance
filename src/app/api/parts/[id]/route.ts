import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const parts = await db.part.findMany({
      include: {
        post: {
          select: { id: true, title: true, userId: true }, // 🔹 incluir userId
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mapear para trazer userId direto no objeto
    const mappedParts = parts.map((part) => ({
      ...part,
      userId: part.post.userId,
      postTitle: part.post.title,
    }));

    return NextResponse.json(mappedParts);
  } catch (error) {
    console.error("Erro ao buscar partes:", error);
    return NextResponse.json({ error: "Erro ao buscar partes" }, { status: 500 });
  }
}

// 🗑️ Deletar parte
// Usamos 'any' no segundo argumento (context) para contornar o erro de tipagem recursiva do Next.js
export async function DELETE(_: NextRequest, context: any) {
  try {
    // Usamos a desestruturação para acessar o ID do objeto, 
    // confiando que a rota dinâmica fornecerá params.id
    const { id } = context.params;

    await db.part.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error: any) {
    console.error("Erro ao deletar parte:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Parte não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro interno ao deletar parte" }, { status: 500 });
  }
}

// ✏️ Atualizar parte inteira (ex: dar baixa)
// Usamos 'any' no segundo argumento (context)
export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const { sold, sellPrice, ...body } = await req.json();

    // Busca o valor atual do sold no banco
    const currentPart = await db.part.findUnique({
      where: { id },
      select: { sold: true },
    });

    if (!currentPart) {
      return NextResponse.json({ error: "Part não encontrada" }, { status: 404 });
    }

    // Soma o sold atual com o novo valor
    const updatedPart = await db.part.update({
      where: { id },
      data: {
        sold: (currentPart.sold || 0) + Number(sold),
        sellPrice: sellPrice ?? undefined,
        sales: body.sales ?? undefined,
      },
    });

    return NextResponse.json(updatedPart);
  } catch (error) {
    console.error("❌ Erro ao atualizar Part:", error);
    return NextResponse.json({ error: "Erro ao atualizar Part" }, { status: 500 });
  }
}

// 🧩 Atualização parcial (apenas preço de venda, etc.)
// Usamos 'any' no segundo argumento (context)
// 🧩 Atualização parcial (apenas preço, peso, etc.)
export async function PATCH(req: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const body = await req.json();

    // Impede peso negativo
    if (body.weight !== undefined && body.weight < 0) {
      return NextResponse.json({ error: "Peso não pode ser negativo" }, { status: 400 });
    }

    const updated = await db.part.update({
      where: { id },
      data: {
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.sellPrice !== undefined && { sellPrice: body.sellPrice }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.sold !== undefined && { sold: body.sold }),
        ...(body.sales !== undefined && { sales: body.sales }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar parte (PATCH):", error);
    return NextResponse.json({ error: "Erro interno ao atualizar parte" }, { status: 500 });
  }
}
