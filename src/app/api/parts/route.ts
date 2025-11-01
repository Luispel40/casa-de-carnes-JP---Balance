import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// ➕ Criar nova parte
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newPart = await db.part.create({
      data: {
        name: body.name,
        weight: body.weight,
        price: body.price,
        sellPrice: body.sellPrice,
        postId: body.postId,
        sold: 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(newPart);
  } catch (error) {
    console.error("Erro ao criar parte:", error);
    return NextResponse.json(
      { error: "Erro ao criar parte" },
      { status: 500 }
    );
  }
}
