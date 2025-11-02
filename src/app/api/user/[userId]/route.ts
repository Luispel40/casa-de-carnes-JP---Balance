import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// 🔍 Buscar usuário
export async function GET(_: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { posts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 });
  }
}

// ✏️ Atualizar usuário
export async function PATCH(req: NextRequest, context: any) {
  const { userId } = context.params;
  const body = await req.json();

  if (!body.name || !body.email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        email: body.email,
        image: body.image,
        address: body.address,
        enteprise: body.enterprise,
        phone: body.phone,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}

// 🗑️ Deletar usuário
export async function DELETE(_: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json({ error: "Erro ao deletar usuário" }, { status: 500 });
  }
}
