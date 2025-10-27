"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { CircleUserRound, Edit, Plus, Trash } from "lucide-react";
import SettingsPopup from "_components/SettingsPopup";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  age: number;
}

export default function EquipPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleSubmit = async (formData: any) => {
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: session?.user?.id,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar funcionário");

      const newEmployee = await res.json();

      // ✅ Atualiza o estado local com o novo funcionário
      setEmployees((prev) => [...prev, newEmployee]);
      toast.success("Funcionário criado com sucesso!");

      setIsPopupOpen(false);
    } catch (err) {
      console.error("Erro ao criar funcionário:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/employees/${session.user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Erro ao deletar funcionário");

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast.success("Funcionário deletado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar funcionário");
    }
  };

  useEffect(() => {
    if (!session) return;

    setLoading(true);
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`/api/employees/${session.user?.id}`);
        if (!res.ok) throw new Error("Erro ao buscar funcionários");
        const json = await res.json();
        setEmployees(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [session]);

  if (!session) {
    return (
      <p className="flex flex-col items-center justify-center min-h-screen gap-4">
        Carregando...
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 w-full">
      <h1 className="text-2xl font-bold">Minha Equipe</h1>
      <div className="border border-gray-300 rounded-lg flex gap-4 h-96 overflow-auto w-[80%]">
        {loading ? (
          <p>Carregando...</p>
        ) : employees.length === 0 ? (
          <p>Nenhum funcionário encontrado.</p>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className="min-w-2xs max-w-2xs w-full md:w-1/3">
              <CardHeader>
                <CircleUserRound />
                <CardAction>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => handleDelete(emp.id)}
                  >
                    <Trash />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Edit />
                  </Button>
                </CardAction>
                <CardTitle>{emp.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Cargo:</strong> {emp.role}
                </p>
                <p>
                  <strong>Salário:</strong> ${emp.salary}
                </p>
                <p>
                  <strong>Idade:</strong> {emp.age}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button
        className="w-full max-w-md mt-4 fixed bottom-4 mx-6"
        onClick={() => setIsPopupOpen(true)}
      >
        Adicionar Funcionário <Plus />
      </Button>
      {isPopupOpen && (
        <SettingsPopup
          type="employees"
          onClose={() => setIsPopupOpen(false)}
          onSubmit={handleSubmit}
          userId={session.user?.id}
        />
      )}
    </div>
  );
}
