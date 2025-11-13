import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await db.sale.findMany({
      include: {
        part: {
          select: {
            id: true,
            name: true,
            postId: true,
            post: {
              select: { title: true, userId: true, category: { select: { id: true, name: true, special: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔹 Formata os dados para o front
    const formatted = sales.map((s) => ({
      id: s.id,
      totalPrice: s.totalPrice,
      profit: s.profit,
      createdAt: s.createdAt,
      partId: s.partId,
      partName: s.part?.name ?? "Desconhecida",
      postTitle: s.part?.post?.title ?? "Sem título",
      userId: s.part?.post?.userId ?? null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("❌ Erro ao buscar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const { partId, quantity, totalPrice, profit, isSpecial } = await req.json();

    const sale = await db.sale.create({
      data: { partId, quantity, totalPrice, profit, isSpecial: isSpecial ?? false },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar venda:", err);
    return NextResponse.json({ error: "Erro ao registrar venda" }, { status: 500 });
  }
}