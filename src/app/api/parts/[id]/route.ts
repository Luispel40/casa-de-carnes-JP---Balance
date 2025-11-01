import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

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
    const body = await req.json();

    const updated = await db.part.update({
      where: { id },
      data: {
        sold: body.sold,
        sellPrice: body.sellPrice,
        sales: body.sales,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar parte (PUT):", error);
    return NextResponse.json({ error: "Erro interno ao atualizar parte" }, { status: 500 });
  }
}

// 🧩 Atualização parcial (apenas preço de venda, etc.)
// Usamos 'any' no segundo argumento (context)
export async function PATCH(req: NextRequest, context: any) {
  try {
    const { id } = context.params;
    const body = await req.json();

    const updated = await db.part.update({
      where: { id },
      data: {
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
