"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { NativeSelect } from "@/_components/ui/native-select";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  special?: boolean;
}

interface PatternPart {
  name: string;
  percentage: number;
}

interface Pattern {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  parts: PatternPart[];
}

export default function PatternForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    categoryId: "",
  });

  const [parts, setParts] = useState<PatternPart[]>([
    { name: "Quebra", percentage: 100 },
  ]);

  // 🔹 Buscar padrões e categorias
  const fetchPatterns = async () => {
    if (!userId) return;
    setLoading(true);
    const res = await fetch(`/api/patterns/${userId}`);
    const data = await res.json();
    setPatterns(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!userId) return;
    const res = await fetch(`/api/categories/${userId}`);
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchPatterns();
    fetchCategories();
  }, [userId]);


  // 🔹 Adicionar parte
  const handleAddPart = () => {
    const usedPercent = parts
      .filter((p) => p.name.toLowerCase() !== "quebra")
      .reduce((acc, p) => acc + (parseFloat(p.percentage.toString()) || 0), 0);

    if (usedPercent >= 100) {
      toast.error(
        "A soma das partes já atingiu 100%. Diminua alguma parte antes de adicionar outra."
      );
      return;
    }

    setParts([
      ...parts.filter((p) => p.name.toLowerCase() !== "quebra"),
      { name: "", percentage: 0 },
      { name: "Quebra", percentage: Math.max(0, 100 - usedPercent) },
    ]);
  };

  // 🔹 Remover parte
  const handleRemovePart = (index: number) => {
    setParts((prev) => {
      const filtered = prev.filter(
        (_, i) => i !== index && _.name.toLowerCase() !== "quebra"
      );
      const usedPercent = filtered.reduce(
        (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
        0
      );
      return [
        ...filtered,
        {
          name: "Quebra",
          percentage: Math.max(0, 100 - usedPercent),
        },
      ];
    });
  };

  // 🔹 Editar parte
  const handlePartChange = (
    index: number,
    field: keyof PatternPart,
    value: string | number
  ) => {
    setParts((prev) => {
      const updated = prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]:
                field === "percentage" ? parseFloat(value as string) : value,
            }
          : p
      );

      const usedPercent = updated
        .filter((p) => p.name.toLowerCase() !== "quebra")
        .reduce(
          (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
          0
        );

      return [
        ...updated.filter((p) => p.name.toLowerCase() !== "quebra"),
        {
          name: "Quebra",
          percentage: Math.max(0, 100 - usedPercent),
        },
      ];
    });
  };

  // 🔹 Salvar padrão (criar ou editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.categoryId) {
      toast.error("Preencha o nome e a categoria");
      return;
    }

    const method = form.id ? "PUT" : "POST";

    const res = await fetch(`/api/patterns/${userId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        parts,
      }),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar padrão");
      return;
    }

    toast.success(form.id ? "Padrão atualizado!" : "Padrão criado!");
    setForm({
      id: "",
      name: "",
      description: "",
      categoryId: "",
    });
    setParts([{ name: "Quebra", percentage: 100 }]);
    fetchPatterns();
  };

  // 🔹 Editar padrão existente
  const handleEdit = (pattern: Pattern) => {
    setForm({
      id: pattern.id,
      name: pattern.name,
      description: pattern.description || "",
      categoryId: pattern.categoryId,
    });

    const hasQuebra = pattern.parts.some(
      (p) => p.name.toLowerCase().trim() === "quebra"
    );
    const updatedParts = hasQuebra
      ? pattern.parts
      : [
          ...pattern.parts,
          {
            name: "Quebra",
            percentage:
              100 -
              pattern.parts.reduce(
                (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
                0
              ),
          },
        ];
    setParts(updatedParts);
  };

  // 🔹 Excluir padrão
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/patterns/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      toast.success("Padrão excluído!");
      fetchPatterns();
    } else {
      toast.error("Erro ao excluir padrão");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Formulário */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Input
              placeholder="Nome do padrão"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <NativeSelect
              name="categoryId"
              value={form.categoryId || ""}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
            >
              <option value="">
                {loading && categories.length === 0
                  ? "Carregando categorias..."
                  : "Selecione uma categoria"}
              </option>
              {categories.filter((cat) => !cat.special).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </NativeSelect>

            <div className="space-y-2 border-t pt-3">
              <h4 className="text-sm font-medium">Partes do Padrão (%)</h4>

              {parts.map((part, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome da parte"
                    value={part.name}
                    onChange={(e) =>
                      handlePartChange(index, "name", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={part.percentage}
                    disabled={part.name.toLowerCase() === "quebra"}
                    onChange={(e) =>
                      handlePartChange(index, "percentage", e.target.value)
                    }
                  />
                  {part.name.toLowerCase() !== "quebra" && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemovePart(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}

              <div className="text-sm text-muted-foreground mt-1">
                Soma total:{" "}
                {parts.reduce(
                  (acc, p) =>
                    acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
                  0
                )}
                %
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPart}
              >
                + Adicionar Parte
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="w-fit">
                {form.id ? "Salvar alterações" : "Criar Padrão"}
              </Button>
              {form.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      id: "",
                      name: "",
                      description: "",
                      categoryId: "",
                    });
                    setParts([{ name: "Quebra", percentage: 100 }]);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de padrões */}
      <div className="grid gap-3">
        {patterns.map((pattern) => (
          <Card key={pattern.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{pattern.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pattern.categoryId
                    ? categories.find((c) => c.id === pattern.categoryId)?.name
                    : "Sem categoria"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pattern.parts.map((p) => p.name).join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(pattern)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(pattern.id)}
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
