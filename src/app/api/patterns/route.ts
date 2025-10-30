import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, categoryId, parts, userId } = body;

    if (!name || !userId || !categoryId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, userId, categoryId" },
        { status: 400 }
      );
    }

    const pattern = await db.pattern.create({
      data: {
        name,
        description,
        user: { connect: { id: userId } },
        category: { connect: { id: categoryId } }, // conecta a categoria
        parts: parts
          ? {
              create: parts.map((p: any) => ({
                name: p.name,
                percentage: p.percentage ?? 0,
              })),
            }
          : undefined,
      },
      include: { parts: true, category: true },
    });

    return NextResponse.json(pattern);
  } catch (err: any) {
    console.error("Erro ao criar padrão:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
