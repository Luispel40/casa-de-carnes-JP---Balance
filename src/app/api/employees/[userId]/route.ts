import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

interface EmployeeBody {
  id?: string;
  name: string;
  role: string;
  salary: number;
  age: number;
} 

export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const employees = await db.employee.findMany({ where: { userId } });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: any) {
  const { userId } = context.params;
  const body = await req.json();
  const { id, title, weight, price, sellPrice, categoryId, isActive, parts } = body;

  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    const updated = await db.post.update({
      where: { id },
      data: {
        title,
        weight: parseFloat(weight),
        price: parseFloat(price),
        sellPrice: sellPrice ? parseFloat(sellPrice) : null,
        categoryId,
        isActive,
        userId,
        parts: {
          deleteMany: {}, // 🔥 deleta todas as partes antigas
          create: parts.map((p: any) => ({
            name: p.name,
            weight: parseFloat(p.weight),
            price: parseFloat(p.price),
            sellPrice: parseFloat(p.sellPrice),
            isActive: p.isActive ?? true,
          })),
        },
      },
      include: { parts: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    await db.post.delete({ where: { id } });
    return NextResponse.json({ message: "Post (e partes) deletados com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar post" }, { status: 500 });
  }
}

