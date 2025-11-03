import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const categories = await db.category.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}
// 🔹 POST — cria nova categoria
export async function POST(req: NextRequest, context: any) {
  try {
    const { userId } = context.params;
    const body = await req.json();

    const newCategory = await db.category.create({
      data: {
        name: body.name,
        userId,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}

// 🔹 PATCH — atualiza categoria
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const updated = await db.category.update({
      where: { id: body.id },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

// 🔹 DELETE — exclui categoria
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 });
  }
}