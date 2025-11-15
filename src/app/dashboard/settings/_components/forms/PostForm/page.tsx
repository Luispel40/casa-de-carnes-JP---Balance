"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/_components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/_components/ui/select";
import { usePostsForm } from "./hooks";
import { Label } from "@/_components/ui/label";
import { MARGIN_PERCENTAGE } from "./functions";
import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import { Switch } from "@/_components/ui/switch";

type Category = {
  id: string;
  name: string;
  special?: boolean;
};

export default function PostsFormTest() {
  const {
    posts,
    parts,
    categories,
    patterns,
    form,
    alreadyExists,
    isEditing,
    isPatternBasedNewPost,
    uniqueTitles,
    handleChange,
    handleTitleSelect,
    handlePatternSelect,
    handlePartChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    setAlreadyExists,
    setForm,
  } = usePostsForm();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Switch Produto Existente */}
            <div className="flex items-center gap-3">
              <Switch
                checked={alreadyExists}
                onCheckedChange={(val) => {
                  setAlreadyExists(val);
                  if (val) {
                    setForm((prev) => ({ ...prev, title: "" }));
                  }
                }}
                disabled={isEditing || isPatternBasedNewPost}
              />
              <Label>Produto/Peça já existe?</Label>
            </div>

            {/* Campos principais */}
            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
              {alreadyExists && !isEditing ? (
                <Select value={form.title} onValueChange={handleTitleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTitles.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Produto/entrada"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  disabled={isPatternBasedNewPost || isEditing}
                />
              )}

              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="border rounded-md px-2 py-1"
                disabled={isPatternBasedNewPost || isEditing}
              >
                <option value="">Selecione a categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Peso e preço */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="weight"
                type="number"
                step={
                  categories.find((c) => c.id === form.categoryId)?.special
                    ? "1"
                    : "0.01"
                }
                value={form.weight}
                onChange={(e) => {
                  const category = categories.find(
                    (c) => c.id === form.categoryId
                  );
                  const value = e.target.value;

                  // 🔹 Se for especial, bloqueia valores com ponto ou vírgula
                  if (category?.special) {
                    if (value.includes(".") || value.includes(",")) return;
                    // Apenas números inteiros
                    if (!/^\d*$/.test(value)) return;
                  }

                  handleChange(e);
                }}
                placeholder={
                  categories.find((c) => c.id === form.categoryId)?.special
                    ? "Quantidade"
                    : "Peso (Kg)"
                }
              />
              <Input
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder={
                  categories.find((c) => c.id === form.categoryId)?.special
                    ? "Preço"
                    : "Preço (R$)"
                }
              />
            </div>

            {/* Padrão */}
            <div className="flex flex-col">
              <Label>Padrão</Label>
              <select
                value={form.patternId}
                onChange={(e) => handlePatternSelect(e.target.value)}
                className="border rounded-md px-2 py-1"
                disabled={alreadyExists || isEditing}
              >
                <option value="">Sem padrão</option>
                {patterns.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Partes */}
            {parts.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <Label>Partes ({form.weight} kg)</Label>
                {parts.map((part, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <Input
                      value={part.name}
                      onChange={(e) =>
                        handlePartChange(i, "name", e.target.value)
                      }
                      disabled={part.name.toLowerCase() === "quebra"}
                    />
                    <Input value={part.percentage} disabled />
                    <Input value={part.weight} disabled />
                  </div>
                ))}
              </div>
            )}

            {/* Ativo + Botões */}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(val) =>
                  setForm((prev) => ({ ...prev, isActive: val }))
                }
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {isEditing
                  ? "Salvar Edição"
                  : alreadyExists
                  ? "Adicionar ao Existente"
                  : "Adicionar Novo"}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid gap-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">
                  {post.category?.name || "Sem categoria"} •{" "}
                  {post.category?.special
                    ? `${post.weight}un`
                    : `${post.weight}kg`}{" "}
                  • R${post.price.toFixed(2)} → Venda R$
                  {(
                    post.sellPrice ?? post.price * (1 + MARGIN_PERCENTAGE)
                  ).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  // onClick={() => handleEdit(post)}
                  disabled={true}
                >
                  Editar
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      Excluir
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Excluir</DialogTitle>
                      <DialogDescription>
                        Excluir {post.title}?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(post.id)}
                        >
                          Confirmar
                        </Button>
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
