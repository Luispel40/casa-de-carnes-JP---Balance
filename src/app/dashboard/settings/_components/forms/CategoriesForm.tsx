"use client";

import { useEffect, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Switch } from "@/_components/ui/switch";
import { Badge } from "@/_components/ui/badge";

interface Category {
  id: string;
  name: string;
  special: boolean;
}

export default function CategoriesForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    special: false,
  });

  const fetchCategories = async () => {
    if (!userId) return;
    const res = await fetch(`/api/categories/${userId}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setCategories(data);
    } else {
      console.error("Resposta inesperada:", data);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchCategories();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    const method = form.id ? "PATCH" : "POST";
    const url = `/api/categories/${userId}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar categoria");
      return;
    }

    toast.success(form.id ? "Categoria atualizada!" : "Categoria criada!");
    setForm({ id: "", name: "", special: false });
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setForm({ id: cat.id, name: cat.name, special: cat.special });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/categories/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Categoria excluída");
      fetchCategories();
    } else {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Badge variant={form.special ? "default" : "outline"}>
              <Switch
                checked={form.special}
                onCheckedChange={(e) => setForm({ ...form, special: e })}
              />
            </Badge>
            <Input
              placeholder="Nome da categoria"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Button type="submit">{form.id ? "Salvar" : "Adicionar"}</Button>
            {form.id && (
              <Button
                variant="outline"
                onClick={() => setForm({ id: "", name: "", special: false })}
              >
                Cancelar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <p className="font-medium">{cat.name}</p>
                {cat.special && (
                  <span className="text-xs text-blue-500 ml-2">Especial</span>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(cat)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(cat.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria encontrada
          </p>
        )}
      </div>
    </div>
  );
}
