import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const category = await db.category.create({
      data: { name, userId },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
