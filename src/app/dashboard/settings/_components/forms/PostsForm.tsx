"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";
import { Label } from "@/_components/ui/label";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface PatternPart {
  id?: string;
  name: string;
  percentage: number;
}

interface Pattern {
  id: string;
  name: string;
  parts: PatternPart[];
}

interface PostPart {
  id?: string;
  name: string;
  percentage: number;
  weight: number;
  price?: number;
  sellPrice?: number;
  isActive?: boolean;
}

interface Post {
  id: string;
  title: string;
  weight: number;
  price: number;
  sellPrice?: number;
  sold: number;
  isActive: boolean;
  categoryId: string;
  category?: Category;
  patternId?: string | null;
  parts?: PostPart[];
}

export default function PostsForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [parts, setParts] = useState<PostPart[]>([]);

  const [form, setForm] = useState({
    id: "",
    title: "",
    weight: "",
    price: "",
    sellPrice: "",
    categoryId: "",
    patternId: "",
    isActive: true,
  });

  // ==============================
  // 🔹 Fetch Data
  // ==============================
  const fetchPosts = async () => {
    if (!userId) return;
    const res = await fetch(`/api/posts/${userId}`);
    if (!res.ok) return;
    const data = await res.json();
    setPosts(data);
  };

  const fetchCategories = async () => {
    if (!userId) return;
    const res = await fetch(`/api/categories/${userId}`);
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data);
  };

  const fetchPatterns = async () => {
    if (!userId) return;
    const res = await fetch(`/api/patterns/${userId}`);
    if (!res.ok) return;
    const data = await res.json();
    setPatterns(data);
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchPatterns();
  }, [userId]);

  // ==============================
  // 🔹 Handle Input Changes
  // ==============================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const isCheckbox = type === "checkbox";
    setForm((prev) => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));

    // recalcular partes se alterar peso
    if (name === "weight" && selectedPattern) {
      const numericWeight = parseFloat(value) || 0;
      const updatedParts = selectedPattern.parts.map((p) => ({
        name: p.name,
        percentage: p.percentage,
        weight: parseFloat(((numericWeight * p.percentage) / 100).toFixed(2)),
        price: parseFloat(form.price) || 0,
        sellPrice: parseFloat(form.sellPrice) || 0,
        isActive: true,
      }));

      const usedPercent = updatedParts.reduce((acc, p) => acc + p.percentage, 0);
      if (usedPercent < 100) {
        updatedParts.push({
          name: "Quebra",
          percentage: 100 - usedPercent,
          weight: parseFloat(((numericWeight * (100 - usedPercent)) / 100).toFixed(2)),
          price: 0,
          sellPrice: 0,
          isActive: true,
        });
      }

      setParts(updatedParts);
    }
  };

  // ==============================
  // 🔹 Handle Pattern Selection
  // ==============================
  const handlePatternSelect = (patternId: string) => {
    setForm((prev) => ({ ...prev, patternId }));

    if (!patternId) {
      setSelectedPattern(null);
      setParts([]);
      return;
    }

    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) return;

    setSelectedPattern(pattern);

    const numericWeight = parseFloat(form.weight) || 0;
    const generatedParts = pattern.parts.map((p) => ({
      name: p.name,
      percentage: p.percentage,
      weight: parseFloat(((numericWeight * p.percentage) / 100).toFixed(2)),
      price: parseFloat(form.price) || 0,
      sellPrice: parseFloat(form.sellPrice) || 0,
      isActive: true,
    }));

    const usedPercent = generatedParts.reduce((acc, p) => acc + p.percentage, 0);
    if (usedPercent < 100) {
      generatedParts.push({
        name: "Quebra",
        percentage: 100 - usedPercent,
        weight: parseFloat(((numericWeight * (100 - usedPercent)) / 100).toFixed(2)),
        price: 0,
        sellPrice: 0,
        isActive: true,
      });
    }

    setParts(generatedParts);
  };

  // ==============================
  // 🔹 Handle Part Changes
  // ==============================
  const handlePartChange = (index: number, field: keyof PostPart, value: any) => {
    const updated = parts.map((p, i) =>
      i === index
        ? {
            ...p,
            [field]: field === "percentage" || field === "weight" ? parseFloat(value) : value,
          }
        : p
    );

    const usedPercent = updated
      .filter((p) => p.name.toLowerCase() !== "quebra")
      .reduce((acc, p) => acc + (p.percentage || 0), 0);

    const filtered = updated.filter((p) => p.name.toLowerCase() !== "quebra");
    filtered.push({
      name: "Quebra",
      percentage: Math.max(0, 100 - usedPercent),
      weight: 0,
      price: 0,
      sellPrice: 0,
      isActive: true,
    });

    setParts(filtered);
  };

  // ==============================
  // 🔹 Submit Form
  // ==============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.weight || !form.price || !form.categoryId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // se não houver padrão, cria parte única 100%
    let adjustedParts = parts.length > 0 ? parts : [
      {
        name: form.title,
        percentage: 100,
        weight: parseFloat(form.weight) || 0,
        price: parseFloat(form.price) || 0,
        sellPrice: form.sellPrice ? parseFloat(form.sellPrice) : 0,
        isActive: true,
      },
    ];

    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/posts/${userId}` : "/api/posts";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        userId,
        weight: parseFloat(form.weight),
        price: parseFloat(form.price),
        sellPrice: form.sellPrice ? parseFloat(form.sellPrice) : 0,
        parts: adjustedParts,
      }),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar o post");
      return;
    }

    toast.success(form.id ? "Post atualizado!" : "Post criado!");
    setForm({
      id: "",
      title: "",
      weight: "",
      price: "",
      sellPrice: "",
      categoryId: "",
      patternId: "",
      isActive: true,
    });
    setParts([]);
    setSelectedPattern(null);
    fetchPosts();
  };

  // ==============================
  // 🔹 Edit / Delete
  // ==============================
  const handleEdit = (post: Post) => {
    setForm({
      id: post.id,
      title: post.title,
      weight: String(post.weight),
      price: String(post.price),
      sellPrice: post.sellPrice ? String(post.sellPrice) : "",
      categoryId: post.categoryId,
      patternId: post.patternId || "",
      isActive: post.isActive,
    });

    setParts(post.parts || []);
    if (post.patternId) {
      const pattern = patterns.find((p) => p.id === post.patternId);
      if (pattern) setSelectedPattern(pattern);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Post excluído com sucesso");
      fetchPosts();
    } else {
      toast.error("Erro ao excluir post");
    }
  };

  // ==============================
  // 🔹 Render
  // ==============================
  return (
    <div className="flex flex-col gap-6">
      {/* Formulário */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Título"
                name="title"
                value={form.title || ""}
                onChange={handleChange}
              />
              <select
                name="categoryId"
                value={form.categoryId || ""}
                onChange={handleChange}
                className="border rounded-md px-2 py-1"
              >
                <option value="">Selecione a categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Peso (kg)"
                name="weight"
                type="number"
                step="0.01"
                value={form.weight || ""}
                onChange={handleChange}
              />
              <Input
                placeholder="Preço base (R$)"
                name="price"
                type="number"
                step="0.01"
                value={form.price || ""}
                onChange={handleChange}
              />
              <Input
                placeholder="Preço de venda (R$)"
                name="sellPrice"
                type="number"
                step="0.01"
                value={form.sellPrice || ""}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col">
              <Label>Padrão</Label>
              <select
                value={form.patternId || ""}
                onChange={(e) => handlePatternSelect(e.target.value)}
                className="border rounded-md px-2 py-1"
              >
                <option value="">Sem padrão</option>
                {patterns.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Parts */}
            {parts.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <Label>Partes do Produto</Label>
                {parts.map((part, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center">
                    <Input
                      value={part.name || ""}
                      onChange={(e) =>
                        handlePartChange(i, "name", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      step="0.1"
                      value={part.percentage ?? 0}
                      disabled={part.name.toLowerCase() === "quebra"}
                      onChange={(e) =>
                        handlePartChange(i, "percentage", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={part.weight ?? 0}
                      disabled
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(val) => setForm({ ...form, isActive: val })}
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="w-fit">
                {form.id ? "Salvar" : "Adicionar"}
              </Button>
              {form.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      id: "",
                      title: "",
                      weight: "",
                      price: "",
                      sellPrice: "",
                      categoryId: "",
                      patternId: "",
                      isActive: true,
                    });
                    setParts([]);
                    setSelectedPattern(null);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      <div className="grid gap-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">
                  {post.category?.name || "Sem categoria"} • {post.weight}kg • R$
                  {post.price}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(post)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(post.id)}
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
