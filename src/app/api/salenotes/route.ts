import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Criar nota
export async function POST(req: Request) {
  try {
    const { userId, totalAmount, items } = await req.json();

    const note = await db.saleNote.create({
      data: {
        userId,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            partId: item.partId,
            name: item.name,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
            totalPrice: item.totalPrice,
            profit: item.profit,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Erro ao criar nota:", error);
    return NextResponse.json({ error: "Erro ao criar nota de venda" }, { status: 500 });
  }
}

// Buscar notas do usuário logado
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Usuário não informado" }, { status: 400 });
  }

  try {
    const notes = await db.saleNote.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Erro ao buscar notas:", error);
    return NextResponse.json({ error: "Erro ao buscar notas" }, { status: 500 });
  }
}
