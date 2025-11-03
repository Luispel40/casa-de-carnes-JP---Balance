"use client";

import { useEffect, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  age: number;
}

export default function EmployeesForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    role: "",
    salary: "",
    age: "",
  });

  const fetchEmployees = async () => {
    if (!userId) return;
    const res = await fetch(`/api/employees/${userId}`);
    const data = await res.json();
    setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/employees/${userId}` : `/api/employees/${userId}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar funcionário" + res.status);
      return;
    }

    toast.success(form.id ? "Funcionário atualizado!" : "Funcionário criado!");
    setForm({ id: "", name: "", role: "", salary: "", age: "" });
    fetchEmployees();
  };

  const handleEdit = (emp: Employee) => {
    setForm({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      salary: emp.salary.toString(),
      age: emp.age.toString(),
    });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/employees/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Funcionário excluído");
      fetchEmployees();
    } else {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Cargo"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Salário"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Idade"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>

            <div className="flex gap-2 mt-2">
              <Button type="submit">{form.id ? "Salvar" : "Adicionar"}</Button>
              {form.id && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setForm({ id: "", name: "", role: "", salary: "", age: "" })
                  }
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {employees.map((emp) => (
          <Card key={emp.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{emp.name}</p>
                <p className="text-sm text-gray-500">
                  {emp.role} — {emp.age} anos
                </p>
                <p className="text-sm text-gray-500">
                  Salário: R$ {emp.salary.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(emp)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(emp.id)}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
