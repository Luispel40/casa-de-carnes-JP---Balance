"use client";

import { ChevronLeft, EllipsisIcon, Loader, Plus, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/_components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import PostItem from "../_components/post";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/_components/ui/sheet";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import SettingsPopup from "_components/SettingsPopup";
import { NativeSelect } from "@/_components/ui/native-select";

// 👇 Import do popup

// 🔹 Helper para formatar moeda
const formatCurrency = (amount: number): string => {
  if (typeof amount !== "number") return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

export default function GraphicsPartsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [openSalesSheet, setOpenSalesSheet] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<
    "today" | "week" | "month" | "year"
  >("today");
  const [salesData, setSalesData] = useState<
    { postTitle: string; totalSales: number; profit: number }[]
  >([]);

  // Sheet state
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [soldValue, setSoldValue] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);

  // 👇 Popup de criação de item
  const [openPopup, setOpenPopup] = useState(false);

  // 🔹 Buscar posts e partes
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/${session.user?.id}`);
        if (!res.ok) throw new Error("Erro ao buscar posts");
        const json = await res.json();

        setPosts(json);

        // 🔹 Extrair todas as partes de todos os posts
        const allParts = json.flatMap(
          (post: any) =>
            post.parts?.map((part: any) => ({
              ...part,
              postTitle: post.title,
              postId: post.id,
              postSold: post.sold || 0,
            })) || []
        );

        setParts(allParts);
      } catch (err) {
        console.error("Erro ao buscar partes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // 🔹 Filtro por post
  const filteredParts = useMemo(() => {
    if (!Array.isArray(parts)) return [];
    if (!selectedPost) return parts;
    return parts.filter((part) => part.postId === selectedPost);
  }, [parts, selectedPost]);

  // 🔹 Deletar parte
  const handleDeletePart = async (id: string) => {
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar part");

      setParts((prev) => prev.filter((part) => part.id !== id));
      toast.success("Parte deletada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar parte");
    }
  };

  const calculateSalesData = () => {
    const now = new Date();
    const filteredParts = parts.filter((part) => {
      // Aqui você pode adicionar lógica para filtrar por data, se tiver um campo `soldAt`
      // Por enquanto, considera todas as vendas
      return true;
    });

    const summary = filteredParts.reduce((acc: any, part) => {
      const totalSales = (part.sold || 0) * (part.sellPrice || 0);
      const profit = (part.sellPrice - (part.price || 0)) * (part.sold || 0);

      const existing = acc.find((a: any) => a.postTitle === part.postTitle);
      if (existing) {
        existing.totalSales += totalSales;
        existing.profit += profit;
      } else {
        acc.push({ postTitle: part.postTitle, totalSales, profit });
      }
      return acc;
    }, []);

    setSalesData(summary);
  };

  // 🔹 Abrir Sheet
  const openEditSheet = (part: any) => {
    setSelectedPart(part);
    setSoldValue(0);
    setSellPrice(part.sellPrice || 0);
    setOpenSheet(true);
  };

  // 🔹 Preencher todo o restante
  const fillAllRemaining = () => {
    if (!selectedPart) return;
    const restante = selectedPart.weight - (selectedPart.sold || 0);
    setSoldValue(restante);
  };

  // 🔹 Confirmar baixa
  const handleBaixa = async () => {
    if (!selectedPart) return;
    if (soldValue <= 0) {
      toast.error("Informe uma quantidade válida para dar baixa.");
      return;
    }

    const restante = selectedPart.weight - (selectedPart.sold || 0);
    if (soldValue > restante) {
      toast.error(`Você não pode vender mais que ${restante}kg.`);
      return;
    }

    try {
      // 🔸 Atualizar a parte
      const partRes = await fetch(`/api/parts/${selectedPart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sold: (selectedPart.sold || 0) + soldValue,
          sellPrice,
        }),
      });
      if (!partRes.ok) throw new Error("Erro ao atualizar parte");
      const updatedPart = await partRes.json();

      // 🔸 Atualizar o post pai
      await fetch(`/api/posts/${session?.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPart.postId,
          sold: (selectedPart.postSold || 0) + soldValue,
        }),
      });

      // Atualiza localmente
      setParts((prev) =>
        prev.map((p) => (p.id === updatedPart.id ? updatedPart : p))
      );

      toast.success(`Baixa registrada com sucesso!`);
      setOpenSheet(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar baixa");
    }
  };

  // 👇 Criar novo item (post)
  const handleCreatePost = async (data: any) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Erro ao criar item");
      const newPost = await res.json();

      setPosts((prev) => [...prev, newPost]);
      toast.success("Item criado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar item");
    }
  };

  // 🌀 Loading e sem partes
  if (loading || !session) {
    return (
      <p className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader className="animate-spin" />
        Carregando...
      </p>
    );
  }

  if (parts.length === 0) {
    return (
      <p className="flex flex-col items-center justify-center min-h-screen gap-4">
        Nenhuma parte encontrada.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Button
        className="fixed bottom-6 right-6 rounded-full p-4 shadow-xl bg-blue-600 text-white"
        onClick={() => {
          calculateSalesData();
          setOpenSalesSheet(true);
        }}
      >
        📊 Vendas & Lucro
      </Button>
      {/* Header */}
      <div className="flex items-center gap-2 w-full sm:w-96 justify-between px-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Partes</h1>
      </div>

      {/* Filtro e Tabela */}
      <div className="flex flex-col items-center justify-center max-h-96 gap-4 border rounded-lg p-6">
        <PostItem
          data={posts.map((post) => ({
            id: post.id,
            title: post.title,
          }))}
          onSelectCategory={setSelectedPost}
        >
          <div className="max-h-[200px] h-[200px] overflow-auto">
            <table className="lg:min-w-lg min-w-full w-[300px] border border-gray-300 p-6 text-sm">
              <tbody className="w-full">
                <tr>
                  <th>Parte</th>
                  <th>Peso</th>
                  <th>Preço</th>
                  <th>Post</th>
                  <th>Ações</th>
                </tr>
                {filteredParts.map((part: any) => (
                  <tr
                    key={part.id}
                    className={part.sold === part.weight ? "hidden" : ""}
                  >
                    <td className="p-2 border-r">{part.name}</td>
                    <td className="p-2 border-r">
                      {part.weight - part.sold}kg
                    </td>
                    <td className="p-2 border-r">
                      {formatCurrency(part.sellPrice)}
                    </td>
                    <td className="p-2 border-r">{part.postTitle}</td>
                    <td className="p-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeletePart(part.id)}
                      >
                        <Trash />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditSheet(part)}
                      >
                        <Plus />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PostItem>
      </div>

      {/* 👇 Botão de adicionar item */}
      <Button className="mt-4" onClick={() => setOpenPopup(true)}>
        + Adicionar Item
      </Button>

      {/* Popup de criação (reutiliza SettingsPopup) */}
      {openPopup && (
        <SettingsPopup
          type="posts"
          userId={session?.user?.id || ""}
          onClose={() => setOpenPopup(false)}
          onSubmit={handleCreatePost}
        />
      )}
      <Sheet open={openSalesSheet} onOpenChange={setOpenSalesSheet}>
        <SheetContent 
        className="px-6"
        >
          <SheetHeader>
            <SheetTitle>Vendas e Margem de Lucro</SheetTitle>
            <SheetDescription>
              Filtre o período para analisar suas vendas.
            </SheetDescription>
          </SheetHeader>

          <div className="mb-4">
            <NativeSelect
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value as any)}
            >
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="year">Este ano</option>
            </NativeSelect>
          </div>

          <table className="w-full border border-gray-300 text-sm rounded-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border-r">Post</th>
                <th className="p-2 border-r">Total vendas</th>
                <th className="p-2 border-r">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((s, i) => (
                <tr key={i}>
                  <td className="p-2 border-r">{s.postTitle}</td>
                  <td className="p-2 border-r">
                    {formatCurrency(s.totalSales)}
                  </td>
                  <td className="p-2 border-r">{formatCurrency(s.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <SheetFooter className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setOpenSalesSheet(false)}>
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 🧾 Sheet */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="px-6">
          <SheetHeader>
            <SheetTitle>{selectedPart?.name || "Editar Parte"}</SheetTitle>
            {selectedPart && (
              <SheetDescription>
                Atualmente temos{" "}
                <strong>
                  {selectedPart.weight - (selectedPart.sold || 0)}kg
                </strong>{" "}
                de <strong>{selectedPart.name}</strong> no estoque.
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="sold">Quantidade vendida (kg)</Label>
                <Input
                  id="sold"
                  type="number"
                  value={soldValue}
                  onChange={(e) => setSoldValue(Number(e.target.value))}
                  max={selectedPart?.weight - (selectedPart?.sold || 0)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mb-1"
                onClick={fillAllRemaining}
              >
                Tudo
              </Button>
            </div>

            <div>
              <Label htmlFor="sellPrice">Preço de venda (R$)</Label>
              <Input
                id="sellPrice"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <SheetFooter className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setOpenSheet(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBaixa}>Dar baixa</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
