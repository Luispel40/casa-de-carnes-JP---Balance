import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const employees = await db.employee.findMany({
      where: { userId: params.userId },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar funcionários" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await db.employee.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Funcionário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar funcionário:", error);
    return NextResponse.json({ error: "Erro ao deletar funcionário" }, { status: 500 });
  }
}

