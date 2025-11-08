"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";
import { Label } from "@/_components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";

// --- Interfaces ---
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
  categoryId: string;
}

interface PostPart {
  id?: string;
  name: string;
  percentage: number;
  weight: number;
  price?: number;
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

const MARGIN_PERCENTAGE = 0.40; // 40% de margem padrão

export default function PostsForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [parts, setParts] = useState<PostPart[]>([]);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [originalPost, setOriginalPost] = useState<Post | null>(null);

  const [form, setForm] = useState({
    id: "",
    title: "",
    weight: "",
    price: "",
    categoryId: "",
    patternId: "",
    isActive: true,
  });

  // --- Helpers ---
  const calculatePartsFromPattern = (pattern: Pattern, weight: number, price: number): PostPart[] => {
    const newParts = pattern.parts.map(p => ({
      name: p.name,
      percentage: p.percentage,
      weight: parseFloat(((weight * p.percentage) / 100).toFixed(2)),
      price,
      isActive: true,
    }));
    const usedPercent = newParts.reduce((sum, p) => sum + p.percentage, 0);
    if (usedPercent < 100) {
      newParts.push({
        name: "Quebra",
        percentage: parseFloat((100 - usedPercent).toFixed(2)),
        weight: parseFloat(((weight * (100 - usedPercent)) / 100).toFixed(2)),
        price: 0,
        isActive: true,
      });
    }
    return newParts;
  };

  const mergeParts = (existingParts: PostPart[], newParts: PostPart[], numericWeight: number, numericPrice: number): PostPart[] => {
    const mergedParts: PostPart[] = [...existingParts];

    newParts.forEach(p => {
      const match = mergedParts.find(mp => mp.name.toLowerCase() === p.name.toLowerCase());
      if (match) {
        match.weight += p.weight;
        match.price = numericPrice; // sempre sobrescreve o price
      } else {
        mergedParts.push({ ...p, price: numericPrice });
      }
    });

    const totalWeight = mergedParts.reduce((sum, p) => sum + p.weight, 0);
    return mergedParts.map(p => ({
      ...p,
      percentage: parseFloat(((p.weight / totalWeight) * 100).toFixed(2)),
      price: numericPrice,
    }));
  };

  const resetForm = useCallback(() => {
    setForm({
      id: "",
      title: "",
      weight: "",
      price: "",
      categoryId: "",
      patternId: "",
      isActive: true,
    });
    setParts([]);
    setSelectedPattern(null);
    setAlreadyExists(false);
    setOriginalPost(null);
  }, []);

  // --- Fetches ---
  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/posts/${userId}`);
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error("Erro ao buscar posts:", e);
    }
  }, [userId]);

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
  }, [userId, fetchPosts]);

  // --- Handlers ---
  const handlePatternSelect = (patternId: string) => {
    let nextForm = { ...form, patternId };
    let selected: Pattern | null = null;
    let newParts: PostPart[] = [];

    if (patternId) {
      const pattern = patterns.find(p => p.id === patternId);
      if (pattern) {
        selected = pattern;
        if (!form.id) {
          nextForm = {
            ...nextForm,
            title: pattern.name,
            categoryId: pattern.categoryId || nextForm.categoryId,
          };
        }
        const numericWeight = parseFloat(nextForm.weight) || 0;
        const numericPrice = parseFloat(nextForm.price) || 0;
        newParts = calculatePartsFromPattern(pattern, numericWeight, numericPrice);
      }
    }

    setForm(nextForm);
    setSelectedPattern(selected);
    setParts(newParts);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    const isEditing = !!form.id;
    const isPatternBasedNewPost = !!selectedPattern && !isEditing;

    if ((isPatternBasedNewPost && (name === "title" || name === "categoryId")) || (isEditing && name === "categoryId")) return;
    if (alreadyExists && name === "title") return;

    setForm({ ...form, [name]: newValue });

    if (name === "weight" && selectedPattern && !isEditing) {
      const numericWeight = parseFloat(value) || 0;
      const numericPrice = parseFloat(form.price) || 0;
      setParts(calculatePartsFromPattern(selectedPattern, numericWeight, numericPrice));
    }

    // Sempre atualizar o price das parts ao mudar o form.price
    if (name === "price") {
      const numericPrice = parseFloat(value) || 0;
      setParts(prevParts => prevParts.map(p => ({ ...p, price: numericPrice })));
    }
  };

  const handleTitleSelect = (newTitle: string) => {
    setForm(prev => ({ ...prev, title: newTitle }));
  };

  const handlePartChange = (index: number, field: keyof PostPart, value: any) => {
    const updated = parts.map((p, i) =>
      i === index ? { ...p, [field]: field === "percentage" ? parseFloat(value) : value } : p
    );

    const numericWeight = parseFloat(form.weight) || 0;
    const usedPercent = updated.filter(p => p.name.toLowerCase() !== "quebra").reduce((acc, p) => acc + (p.percentage || 0), 0);
    const remainingPercent = Math.max(0, 100 - usedPercent);
    const filtered = updated.filter(p => p.name.toLowerCase() !== "quebra");

    if (remainingPercent > 0) {
      filtered.push({
        name: "Quebra",
        percentage: parseFloat(remainingPercent.toFixed(2)),
        weight: parseFloat(((remainingPercent / 100) * numericWeight).toFixed(2)),
        price: parseFloat(form.price) || 0,
        isActive: true,
      });
    }

    setParts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.weight || !form.price || !form.categoryId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const numericWeight = parseFloat(form.weight);
    const numericPrice = parseFloat(form.price);
    const sellPrice = parseFloat((numericPrice * (1 + MARGIN_PERCENTAGE)).toFixed(2));

    let adjustedParts: PostPart[] = parts.length
      ? parts.map(p => ({ ...p, price: numericPrice })) // garante que todas as parts recebam o price do form
      : [{ name: form.title, weight: numericWeight, price: numericPrice, percentage: 100, isActive: true }];

    // --- Editar existente ---
    if (form.id && originalPost) {
      const updatedParts = adjustedParts.map(p => {
        if (p.name.toLowerCase() !== "quebra") {
          return { ...p, weight: numericWeight * (p.percentage / 100), price: numericPrice };
        }
        const totalOtherWeight = adjustedParts.filter(ap => ap.name.toLowerCase() !== "quebra").reduce((sum, ap) => sum + ap.weight, 0);
        return { ...p, weight: numericWeight - totalOtherWeight, price: numericPrice };
      });

      const res = await fetch(`/api/posts/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          weight: numericWeight,
          price: numericPrice,
          sellPrice,
          categoryId: form.categoryId,
          isActive: form.isActive,
          userId,
          parts: updatedParts,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Erro ao salvar edição do post:", err);
        return toast.error("Erro ao salvar edição do post");
      }

      toast.success(`Post "${form.title}" editado com sucesso!`);
      resetForm();
      fetchPosts();
      return;
    }

    // --- Merge em existente com padrão ---
    const existingPost = posts.find(p => p.title.toLowerCase() === form.title.toLowerCase());
    if (existingPost && selectedPattern) {
      const newWeight = existingPost.weight + numericWeight;
      const mergedParts = mergeParts(existingPost.parts ?? [], adjustedParts, numericWeight, numericPrice);

      const res = await fetch(`/api/posts/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingPost.id,
          title: existingPost.title,
          weight: newWeight,
          price: numericPrice,
          sellPrice,
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

      toast.success(`Post "${existingPost.title}" atualizado: Peso do padrão somado!`);
      resetForm();
      fetchPosts();
      return;
    }

    // --- Criar novo ---
    const res = await fetch(`/api/posts/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        weight: numericWeight,
        price: numericPrice,
        sellPrice,
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
    resetForm();
    fetchPosts();
  };

  const handleEdit = (post: Post) => {
    setOriginalPost(post);
    setForm({
      id: post.id,
      title: post.title,
      weight: String(post.weight),
      price: String(post.price),
      categoryId: post.categoryId,
      patternId: post.patternId || "",
      isActive: post.isActive,
    });
    setAlreadyExists(false);

    let selected: Pattern | null = null;
    if (post.patternId) {
      const pattern = patterns.find(p => p.id === post.patternId);
      if (pattern) selected = pattern;
    }

    setSelectedPattern(selected);
    setParts(post.parts?.map(p => ({ ...p, price: parseFloat(form.price) })) ?? []);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) toast.success("Post excluído com sucesso");
    else toast.error("Erro ao excluir post");
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const isEditing = !!form.id;
  const isPatternBasedNewPost = useMemo(() => !!selectedPattern && !isEditing, [selectedPattern, isEditing]);

  const uniqueTitles = useMemo(() => {
    const names = new Set<string>();
    posts.forEach(post => {
      names.add(post.title);
      post.parts?.forEach(part => {
        if (part.name.toLowerCase() !== 'quebra') names.add(part.name);
      });
    });
    if (form.id) names.delete(form.title);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [posts, form.id, form.title]);

  // --- JSX (mantido igual) ---
  return (
    <div className="flex flex-col gap-6">
      {/* Formulário */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Switch Produto Existente */}
            <div className="flex items-center gap-3">
              <Switch
                checked={alreadyExists}
                onCheckedChange={(val) => {
                  setAlreadyExists(val);
                  if (val) {
                    setForm(prev => ({ ...prev, title: "" }));
                    setSelectedPattern(null);
                  }
                }}
                disabled={isEditing || isPatternBasedNewPost}
              />
              <Label>Produto/Peça já existe?</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {alreadyExists && !isEditing ? (
                <Select value={form.title} onValueChange={handleTitleSelect}>
                  <SelectTrigger disabled={isEditing}>
                    <SelectValue placeholder="Selecione um produto/peça existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTitles.map(title => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                    {uniqueTitles.length === 0 && (
                      <SelectItem disabled value="NenhumItem">Nenhum produto/peça encontrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Título (Nome do produto/peça)"
                  name="title"
                  value={form.title ?? ""}
                  onChange={handleChange}
                  disabled={isPatternBasedNewPost || isEditing}
                />
              )}

              <select
                name="categoryId"
                value={form.categoryId || ""}
                onChange={handleChange}
                className="border rounded-md px-2 py-1"
                disabled={isPatternBasedNewPost || isEditing}
              >
                <option value="">Selecione a categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={isEditing ? "Adicionar Peso (Kg) à Soma" : "Peso Inicial (Kg)"}
                name="weight"
                type="number"
                step="0.01"
                value={form.weight ?? ""}
                onChange={handleChange}
              />
              <Input
                placeholder={isEditing ? "Novo Preço Base (R$/Kg)" : "Preço Base (R$/Kg)"}
                name="price"
                type="number"
                step="0.01"
                value={form.price ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col">
              <Label>Padrão de Peças</Label>
              <select
                value={form.patternId || ""}
                onChange={(e) => handlePatternSelect(e.target.value)}
                className="border rounded-md px-2 py-1"
                disabled={alreadyExists || isEditing}
              >
                <option value="">Sem padrão</option>
                {patterns.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {parts.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <Label>Partes do Produto ({form.weight} kg)</Label>
                {parts.map((part, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center">
                    <Input value={part.name ?? ""} onChange={(e) => handlePartChange(i, "name", e.target.value)} disabled={part.name.toLowerCase() === "quebra"} />
                    <Input placeholder="%" type="number" step="0.1" value={part.percentage} disabled />
                    <Input placeholder="Peso (Kg)" type="number" step="0.01" value={part.weight} disabled />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(val) => setForm(prev => ({ ...prev, isActive: val }))} />
              <Label>Ativo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="w-fit">
                {isEditing ? "Salvar Edição" : (alreadyExists ? "Adicionar ao Existente" : "Adicionar Novo")}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar Edição
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      <div className="grid gap-3">
        {posts.map(post => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">
                  {post.category?.name || "Sem categoria"} • <b>{post.weight.toFixed(2)}kg</b> • Preço Base: <b>R${post.price.toFixed(2)}</b> • Preço Venda: <b>R${(post.sellPrice ?? (post.price * (1 + MARGIN_PERCENTAGE))).toFixed(2)}</b>
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
