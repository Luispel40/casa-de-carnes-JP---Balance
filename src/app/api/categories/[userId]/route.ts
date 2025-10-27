import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { userId: string } }
) {
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
