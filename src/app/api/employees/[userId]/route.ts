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

export async function DELETE(req: NextRequest, context: any) {
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Funcionário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar funcionário:", error);
    return NextResponse.json({ error: "Erro ao deletar funcionário" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: any) {
  const { userId } = context.params;
  const body: EmployeeBody = await req.json();
  const { id, name, role, salary, age } = body;

  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });

    const updated = await db.employee.update({
      where: { id },
      data: { name, role, salary: Number(salary), age: Number(age), userId },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erro ao atualizar funcionário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar funcionário" },
      { status: 500 }
    );
  }
}
