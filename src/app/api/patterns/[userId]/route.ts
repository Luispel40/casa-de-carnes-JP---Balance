import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// 🧩 Interface dos dados do padrão
interface PatternPartInput {
  name: string;
  percentage: number;
}

interface PatternBody {
  id?: string;
  name: string;
  description?: string;
  categoryId?: string;
  userId: string;
  parts: PatternPartInput[];
}

// 🟢 GET — lista todos os padrões de um usuário
export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const patterns = await db.pattern.findMany({
      where: { userId },
      include: { parts: true, category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patterns);
  } catch (error) {
    console.error("❌ Erro ao buscar padrões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar padrões" },
      { status: 500 }
    );
  }
}

// 🟢 POST — cria um novo padrão e suas partes
export async function POST(req: NextRequest, context: any) {
  const { userId } = context.params;
  const body: PatternBody = await req.json();
  const { name, description, categoryId, parts } = body;

  if (!name)
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!parts || parts.length === 0)
    return NextResponse.json(
      { error: "O padrão deve conter pelo menos uma parte" },
      { status: 400 }
    );

  try {
    const pattern = await db.pattern.create({
      data: {
        name,
        description,
        userId,
        categoryId,
        parts: {
          create: parts.map((p) => ({
            name: p.name,
            percentage: p.percentage,
          })),
        },
      },
      include: { parts: true },
    });

    return NextResponse.json(pattern);
  } catch (error: any) {
    console.error("❌ Erro ao criar padrão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar padrão" },
      { status: 500 }
    );
  }
}

// 🟠 PUT — atualiza padrão e suas partes (substitui completamente)
export async function PUT(req: NextRequest, context: any) {
  const body: PatternBody = await req.json();
  const { id, name, description, categoryId, userId, parts } = body;

  if (!id)
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    const existing = await db.pattern.findUnique({
      where: { id },
      include: { parts: true },
    });

    if (!existing)
      return NextResponse.json(
        { error: "Padrão não encontrado" },
        { status: 404 }
      );

    // Deleta partes antigas antes de recriar
    await db.patternPart.deleteMany({
      where: { patternId: id },
    });

    const updated = await db.pattern.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        userId,
        parts: {
          create: parts.map((p) => ({
            name: p.name,
            percentage: p.percentage,
          })),
        },
      },
      include: { parts: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("❌ Erro ao atualizar padrão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar padrão" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE — remove um padrão (e suas partes em cascata)
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id)
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    await db.pattern.delete({ where: { id } });
    return NextResponse.json({ message: "Padrão deletado com sucesso" });
  } catch (error: any) {
    console.error("❌ Erro ao deletar padrão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar padrão" },
      { status: 500 }
    );
  }
}
