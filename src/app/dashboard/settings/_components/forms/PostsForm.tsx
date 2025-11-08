"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";
import { Label } from "@/_components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";

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
  categoryId: string; // Adicionado
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
  // 🔹 Fetch Data (Mantido)
  // ==============================
  const fetchPosts = async () => {
    if (!userId) return;
    try {
        const res = await fetch(`/api/posts/${userId}`);
        const data = await res.json();
        setPosts(data);
    } catch (e) {
        console.error("Erro ao buscar posts:", e);
    }
  };

  const fetchCategories = async () => {
    if (!userId) return;
    try {
        const res = await fetch(`/api/categories/${userId}`);
        const data = await res.json();
        setCategories(data);
    } catch (e) {
        console.error("Erro ao buscar categorias:", e);
    }
  };

  const fetchPatterns = async () => {
    if (!userId) return;
    try {
        const res = await fetch(`/api/patterns/${userId}`);
        const data = await res.json();
        setPatterns(data);
    } catch (e) {
        console.error("Erro ao buscar padrões:", e);
    }
  };

  useEffect(() => {
    if (userId) {
        fetchPosts();
        fetchCategories();
        fetchPatterns();
    }
  }, [userId]);

  // ==============================
  // 🔹 Pattern Selection (Atualizado: Preenche Título e Categoria se for novo post)
  // ==============================
  const handlePatternSelect = (patternId: string) => {
    let nextForm = { ...form, patternId };
    let selected: Pattern | null = null;
    let newParts: PostPart[] = [];

    if (patternId) {
      const pattern = patterns.find((p) => p.id === patternId);
      if (pattern) {
        selected = pattern;

        // NOVO: Se for um novo post, preenche Título e Categoria com o Padrão
        if (!form.id) {
            nextForm = {
                ...nextForm,
                title: pattern.name,
                categoryId: pattern.categoryId || nextForm.categoryId,
            };
        }

        const numericWeight = parseFloat(nextForm.weight) || 0;
        newParts = pattern.parts.map((p) => ({
          name: p.name,
          percentage: p.percentage,
          weight: parseFloat(((numericWeight * p.percentage) / 100).toFixed(2)),
          price: parseFloat(nextForm.price) || 0,
          sellPrice: parseFloat(nextForm.sellPrice) || 0,
          isActive: true,
        }));

        // Parte "Quebra"
        const usedPercent = newParts.reduce((acc, p) => acc + p.percentage, 0);
        if (usedPercent < 100) {
          newParts.push({
            name: "Quebra",
            percentage: parseFloat((100 - usedPercent).toFixed(2)),
            weight: parseFloat(((numericWeight * (100 - usedPercent)) / 100).toFixed(2)),
            price: 0,
            sellPrice: 0,
            isActive: true,
          });
        }
      }
    }

    setForm(nextForm);
    setSelectedPattern(selected);
    setParts(newParts);
  };

  // ==============================
  // 🔹 Input Changes (Atualizado: Bloqueia inputs se for novo post baseado em padrão)
  // ==============================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const isCheckbox = type === "checkbox";
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    // NOVO: Previne alteração manual de Title/Category se o post for novo e baseado em padrão.
    const isPatternBasedNewPost = !!selectedPattern && !form.id;
    if (isPatternBasedNewPost && (name === 'title' || name === 'categoryId')) {
        return;
    }

    setForm({ ...form, [name]: newValue });

    // recalcular partes ao alterar peso
    if (name === "weight" && selectedPattern) {
      const numericWeight = parseFloat(value) || 0;
      const updatedParts: PostPart[] = selectedPattern.parts.map((p) => ({
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
          percentage: parseFloat((100 - usedPercent).toFixed(2)),
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
  // 🔹 Part Editing (Mantido com correção da Quebra)
  // ==============================
  const handlePartChange = (index: number, field: keyof PostPart, value: any) => {
    const updated = parts.map((p, i) =>
      i === index ? { ...p, [field]: field === "percentage" ? parseFloat(value) : value } : p
    );

    // Atualiza parte "Quebra" com base na soma das porcentagens das outras partes.
    const usedPercent = updated.filter((p) => p.name.toLowerCase() !== "quebra")
      .reduce((acc, p) => acc + (p.percentage || 0), 0);

    const filtered = updated.filter((p) => p.name.toLowerCase() !== "quebra");
    const numericWeight = parseFloat(form.weight) || 0;

    const remainingPercent = Math.max(0, 100 - usedPercent);
    const remainingWeight = (remainingPercent / 100) * numericWeight;

    if (remainingPercent > 0) {
        filtered.push({ 
            name: "Quebra", 
            percentage: parseFloat(remainingPercent.toFixed(2)), 
            weight: parseFloat(remainingWeight.toFixed(2)), 
            price: 0, 
            sellPrice: 0, 
            isActive: true
        });
    }
    
    setParts(filtered);
  };

  // ==============================
  // 🔹 Submit com merge de posts (Mantido)
  // ==============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.weight || !form.price || !form.categoryId) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
    }

    const numericWeight = parseFloat(form.weight);
    const numericPrice = parseFloat(form.price);
    const numericSellPrice = parseFloat(form.sellPrice) || 0;

    // 🔹 Cria partes do form
    let adjustedParts: PostPart[] = parts.length
        ? parts
        : [
            {
                name: form.title,
                weight: numericWeight,
                price: numericPrice,
                sellPrice: numericSellPrice,
                isActive: true,
                percentage: 100,
            },
        ];

    // 🔹 Checa se post já existe
    const existing = posts.find((p) => p.title.toLowerCase() === form.title.toLowerCase());

    if (existing) {
        // --- 🔄 MERGE COM POST EXISTENTE ---
        const mergedWeight = existing.weight + numericWeight;
        const mergedPrice =
            (existing.price * existing.weight + numericPrice * numericWeight) /
            mergedWeight;
        const mergedSellPrice =
            ((existing.sellPrice ?? 0) * existing.weight +
                numericSellPrice * numericWeight) /
            mergedWeight;

        // --- 🔄 MERGE DAS PARTES ---
        const mergedParts: PostPart[] = [...(existing.parts ?? [])];

        adjustedParts.forEach((p) => {
            const match = mergedParts.find((mp) => mp.name === p.name);
            if (match) {
                const newWeight = match.weight + (p.weight || 0); // Adicionado (p.weight || 0) por segurança
                match.price =
                    ((match.price ?? 0) * match.weight + (p.price ?? 0) * (p.weight || 0)) /
                    newWeight;
                match.sellPrice =
                    ((match.sellPrice ?? 0) * match.weight +
                        (p.sellPrice ?? 0) * (p.weight || 0)) /
                    newWeight;
                match.weight = newWeight;
            } else {
                mergedParts.push(p);
            }
        });

        // --- 🔄 PUT para atualizar post existente ---
        const res = await fetch(`/api/posts/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: existing.id,
                title: existing.title,
                weight: mergedWeight,
                price: mergedPrice,
                sellPrice: mergedSellPrice,
                categoryId: form.categoryId,
                isActive: form.isActive,
                userId,
                parts: mergedParts,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Erro ao atualizar post:", err);
            return toast.error("Erro ao atualizar post");
        }

        toast.success("Post atualizado com merge!");
    } else {
        // --- 🆕 POST novo ---
        const res = await fetch(`/api/posts/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: form.title,
                weight: numericWeight,
                price: numericPrice,
                sellPrice: numericSellPrice,
                categoryId: form.categoryId,
                isActive: form.isActive,
                userId,
                parts: adjustedParts,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Erro ao criar post:", err);
            return toast.error("Erro ao criar post");
        }

        toast.success("Post criado!");
    }

    // 🔁 Reset form
    setForm({
        id: "", title: "", weight: "", price: "", sellPrice: "", categoryId: "", patternId: "", isActive: true,
    });
    setParts([]);
    setSelectedPattern(null);
    fetchPosts();
};

  // ==============================
  // 🔹 Editar (Atualizado: Lógica de Redistribuição de Peso)
  // ==============================
  const handleEdit = (post: Post) => {
    // 1. Seta o formulário
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

    let partsToSet = post.parts || [];
    let selected: Pattern | null = null;

    if (post.patternId) {
        const pattern = patterns.find((p) => p.id === post.patternId);
        if (pattern) {
            selected = pattern;

            // NOVO: Lógica de Redistribuição de Peso se o Título do Post for igual ao Nome do Padrão
            if (post.title.toLowerCase() === pattern.name.toLowerCase()) {
                const numericWeight = post.weight;
                const patternPartMap = new Map(pattern.parts.map(p => [p.name.toLowerCase(), p]));

                const updatedParts: PostPart[] = [];
                
                // 1. Atualiza partes existentes que também estão no padrão
                for (const postPart of partsToSet) {
                    const patternPart = patternPartMap.get(postPart.name.toLowerCase());
                    
                    if (patternPart) {
                        // Recalcula peso e seta nova porcentagem do padrão
                        const newWeight = (patternPart.percentage / 100) * numericWeight;
                        
                        updatedParts.push({
                            ...postPart,
                            weight: parseFloat(newWeight.toFixed(2)),
                            percentage: patternPart.percentage,
                        });
                    } else if (postPart.name.toLowerCase() !== "quebra") {
                        // Mantém partes que não estão no padrão (exceto "Quebra")
                        updatedParts.push(postPart);
                    }
                }
                
                // 2. Garante que "Quebra" é o último e tem o restante da porcentagem
                const totalExistingPercent = updatedParts.reduce((acc, p) => acc + (p.percentage || 0), 0);
                const remainingPercent = 100 - totalExistingPercent;
                const remainingWeight = (remainingPercent / 100) * numericWeight;
                
                // Adiciona Quebra recalculada
                if (remainingPercent > 0) {
                    updatedParts.push({
                        name: "Quebra",
                        percentage: parseFloat(remainingPercent.toFixed(2)),
                        weight: parseFloat(remainingWeight.toFixed(2)),
                        price: 0,
                        sellPrice: 0,
                        isActive: true,
                    });
                }

                partsToSet = updatedParts;
            }
            setSelectedPattern(pattern);
        }
    }

    setParts(partsToSet);
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
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const isPatternBasedNewPost = useMemo(() => !!selectedPattern && !form.id, [selectedPattern, form.id]);

  // ==============================
  // 🔹 Render (Atualizado: Adiciona disabled aos inputs)
  // ==============================
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="Título" 
                name="title" 
                value={form.title ?? ""} 
                onChange={handleChange} 
                disabled={isPatternBasedNewPost} // NOVO: Desativa se for novo post baseado em padrão
              />
              <select
                name="categoryId"
                value={form.categoryId || ""}
                onChange={handleChange}
                className="border rounded-md px-2 py-1"
                disabled={isPatternBasedNewPost} // NOVO: Desativa se for novo post baseado em padrão
              >
                <option value="">Selecione a categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Adicione mais peso" name="weight" type="number" step="0.01" value={""} onChange={handleChange} />
              <Input placeholder="Preço base (R$)" name="price" type="number" step="0.01" value={form.price ?? ""} onChange={handleChange} />
              <Input placeholder="Preço de venda (R$)" name="sellPrice" type="number" step="0.01" value={form.sellPrice ?? ""} onChange={handleChange} />
            </div>

            <div className="flex flex-col">
              <Label>Padrão</Label>
              <select value={form.patternId || ""} onChange={(e) => handlePatternSelect(e.target.value)} className="border rounded-md px-2 py-1">
                <option value="">Sem padrão</option>
                {patterns.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {parts.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <Label>Partes do Produto</Label>
                {parts.map((part, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center">
                    <Input value={part.name ?? ""} onChange={(e) => handlePartChange(i, "name", e.target.value)} disabled={part.name.toLowerCase() === 'quebra'}/>
                    <Input type="number" step="0.1" value={part.percentage} disabled onChange={(e) => handlePartChange(i, "percentage", e.target.value)} />
                    <Input type="number" step="0.01" value={part.weight} disabled />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(val) => setForm((prev) => ({ ...prev, isActive: val }))} />
              <Label>Ativo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="w-fit">{form.id ? "Salvar" : "Adicionar"}</Button>
              {form.id && (
                <Button type="button" variant="outline" onClick={() => {
                  setForm({ id: "", title: "", weight: "", price: "", sellPrice: "", categoryId: "", patternId: "", isActive: true });
                  setParts([]);
                  setSelectedPattern(null);
                }}>Cancelar</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">
                  {post.category?.name || "Sem categoria"} • {post.weight}kg • R${post.price}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>Editar</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">Excluir</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Excluir post</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja excluir o post <b>{post.title}</b>?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>Excluir</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}