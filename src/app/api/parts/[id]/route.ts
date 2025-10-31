import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// 🗑️ Deletar parte
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await db.part.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar parte:", error);
    return NextResponse.json({ error: "Erro ao deletar parte" }, { status: 500 });
  }
}

// ✏️ Atualizar parte inteira (ex: dar baixa)
export async function PUT(req: NextRequest, { params }: any) {
  try {
    const { id } = params;
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
    return NextResponse.json({ error: "Erro ao atualizar parte" }, { status: 500 });
  }
}

// 🧩 Atualização parcial (apenas preço de venda, etc.)
export async function PATCH(req: NextRequest, { params }: any) {
  try {
    const { id } = params;
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
    return NextResponse.json({ error: "Erro ao atualizar parte" }, { status: 500 });
  }
}
