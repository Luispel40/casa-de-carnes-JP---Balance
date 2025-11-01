"use client";

import React, { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/_components/ui/button";
import { ChevronLeft, Loader } from "lucide-react";
import { toast } from "sonner";

import SettingsPopup from "_components/SettingsPopup";
import PartsTable from "./_components/PartsTable";
import EditPartSheet from "./_components/EditPartSheet";
import SalesSummarySheet from "./_components/SalesSummarySheet";
import SalesChartDrawer from "./_components/SalesChartDrawer";
import { playSound } from "utils/play-sound";
import SaleNotesSheet from "./_components/SaleNotesSheet";

// Helper

export default function GraphicsPartsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [selectedPost, setSelectedPost] = useState<string>("");

  // Sheets & Drawer
  const [openSalesSheet, setOpenSalesSheet] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<
    "hour" | "today" | "week" | "month" | "year" | "ever"
  >("today");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Edit sheet
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [soldValue, setSoldValue] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [soldParts, setSoldParts] = useState<
    { part: any; soldValue: number; sellPrice: number }[]
  >([]);
  const [openEditSheet, setOpenEditSheet] = useState(false);
  const [openNotesSheet, setOpenNotesSheet] = useState(false);

  // Popup
  const [openPopup, setOpenPopup] = useState(false);

  // Fetch posts e partes
  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/${session.user?.id}`);
        if (!res.ok) throw new Error("Erro ao buscar posts");
        const json = await res.json();
        setPosts(json);

        const allParts = json.flatMap(
          (post: any) =>
            post.parts?.map((part: any) => ({
              ...part,
              postTitle: post.title,
              postId: post.id,
              postSold: post.sold || 0,
              userId
            })) || []
        );
        setParts(allParts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // Filtrar partes por post

  // Deletar parte
  const handleDeletePart = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar part");
      setParts((prev) => prev.filter((p) => p.id !== id));
      toast.success(`${name} deletado com sucesso!`);
    } catch {
      toast.error("Erro ao deletar parte");
    }
  };

  // Abrir sheet de edição
  const handleOpenEditSheet = (part: any) => {
    setSoldParts((prev) => {
      if (prev.some((p) => p.part.id === part.id)) return prev; // evita duplicatas
      return [...prev, { part, soldValue: 0, sellPrice: part.sellPrice || 0 }];
    });
    setOpenEditSheet(true);
  };


  const handleBaixa = async () => {
    if (soldParts.length === 0) {
      toast.error("Adicione pelo menos uma parte para dar baixa.");
      return;
    }

    for (const item of soldParts) {
      if (item.soldValue <= 0) {
        toast.error(`Quantidade inválida para ${item.part.name}.`);
        return;
      }
      const restante = item.part.weight - (item.part.sold || 0);
      if (item.soldValue > restante) {
        toast.error(
          `Você não pode vender mais que ${restante}kg de ${item.part.name}.`
        );
        return;
      }
    }

    try {
      // Atualiza cada parte e cria vendas
      for (const item of soldParts) {
        const { part, soldValue, sellPrice } = item;

        const partRes = await fetch(`/api/parts/${part.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sold: (part.sold || 0) + soldValue,
            sellPrice,
            userId
          }),
        });
        if (!partRes.ok) throw new Error(`Erro ao atualizar ${part.name}`);
        const updatedPart = await partRes.json();

        const totalPrice = soldValue * sellPrice;
        const profit = (sellPrice - (part.price || 0)) * soldValue;

        await fetch(`/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partId: part.id,
            quantity: soldValue,
            totalPrice,
            profit,
            userId
          }),
        });

        await fetch(`/api/posts/${session?.user?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: part.postId,
            sold: (part.postSold || 0) + soldValue,
            userId
          }),
        });

        setParts((prev) =>
          prev.map((p) => (p.id === updatedPart.id ? updatedPart : p))
        );
      }

      toast.success("Baixa registrada com sucesso!");
      playSound("/sounds/cash-register.mp3");
      setSoldParts([]);
      setOpenEditSheet(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar baixa");
    }
  };

  // Criar novo post
  const handleCreatePost = async (data: any) => {
    try {
      const body = { ...data, userId: session?.user?.id };

      const res = await fetch(`/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(`❌ Erro ao criar item: ${text}`);
        return;
      }

      const newPost = await res.json();
      setPosts((prev) => [...prev, newPost]);
      toast.success("✅ Item criado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Falha ao criar item");
    }
  };


  // Calcular vendas e lucro agrupados por nome da parte
  const calculateSalesData = async () => {
    if (!session?.user?.id) return;

    const res = await fetch(`/api/sales`);
    if (!res.ok) throw new Error("Erro ao buscar vendas");
    const sales = await res.json();
    const now = new Date();

    // 🔹 Filtra apenas vendas do usuário logado
    const userSales = sales.filter((s: any) => s.userId === session.user.id);

    // 🔹 Filtra pelo período selecionado
    const filteredSales = userSales.filter((sale: any) => {
      const createdAt = new Date(sale.createdAt);
      switch (salesPeriod) {
        case "hour": {
          const d = new Date(now);
          d.setHours(now.getHours() - 1);
          return createdAt >= d;
        }
        case "today":
          return createdAt.toDateString() === now.toDateString();
        case "week": {
          const d = new Date(now);
          d.setDate(now.getDate() - 7);
          return createdAt >= d;
        }
        case "month":
          return (
            createdAt.getMonth() === now.getMonth() &&
            createdAt.getFullYear() === now.getFullYear()
          );
        case "year":
          return createdAt.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // 🔹 Agrupar vendas pelo nome da parte
    const summaryMap = new Map<
      string,
      { totalSales: number; profit: number; postTitle: string }
    >();

    filteredSales.forEach((sale: any) => {
      const partName = sale.partName || "Sem nome";
      const postTitle = sale.postTitle || "Sem título";
      const totalPrice = sale.totalPrice || 0;
      const profit = sale.profit || 0;

      if (summaryMap.has(partName)) {
        const existing = summaryMap.get(partName)!;
        summaryMap.set(partName, {
          totalSales: existing.totalSales + totalPrice,
          profit: existing.profit + profit,
          postTitle,
        });
      } else {
        summaryMap.set(partName, { totalSales: totalPrice, profit, postTitle });
      }
    });

    // 🔹 Converter o mapa em array e ordenar pelo lucro
    const summary = Array.from(summaryMap.entries()).map(
      ([partName, data]) => ({
        partName,
        totalSales: data.totalSales,
        profit: data.profit,
        postTitle: data.postTitle,
      })
    );

    summary.sort((a, b) => b.profit - a.profit);

    setSalesData(summary);
  };

  // Buscar dados do gráfico
  const fetchSalesChart = async () => {
    try {
      const res = await fetch("/api/sales");
      if (!res.ok) throw new Error("Erro ao buscar vendas");
      const sales = await res.json();

      const now = new Date();

      // 🔹 Filtra pelo período selecionado
      const filtered = sales.filter((s: any) => {
        const createdAt = new Date(s.createdAt);
        switch (salesPeriod) {
          case "hour": {
            const d = new Date(now);
            d.setHours(now.getHours() - 1);
            return createdAt >= d;
          }
          case "today":
            return createdAt.toDateString() === now.toDateString();
          case "week": {
            const d = new Date(now);
            d.setDate(now.getDate() - 7);
            return createdAt >= d;
          }
          case "month":
            return (
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getFullYear() === now.getFullYear()
            );
          case "year":
            return createdAt.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });

      // 🔹 Mapeia cada venda individualmente
      const mapped = filtered.map((s: any) => ({
        partName: s.partName || "Desconhecida",
        totalSales: s.totalPrice,
        profit: s.profit,
        createdAt: new Date(s.createdAt).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setChartData(mapped);
    } catch (err) {
      console.error("Erro ao carregar gráfico de vendas:", err);
      toast.error("Erro ao carregar dados de vendas");
    }
  };
  const userId = session?.user?.id;

  if (!userId) return <p>Carregando ou não autenticado...</p>;

  if (loading || !session)
    return (
      <p className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        <Loader className="animate-spin" /> Carregando...
      </p>
    );
  if (parts.length === 0)
    return (
      <p className="flex flex-col items-center justify-center min-h-[350px] gap-4">
        Nenhuma parte encontrada.
      </p>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
      <Button
        className="group fixed bottom-16 right-6 flex items-center gap-2 rounded-full bg-green-600 text-white shadow-xl transition-all duration-300 hover:pr-6"
        onClick={() => {
          fetchSalesChart();
          setOpenDrawer(true);
        }}
      >
        <span className="p-4">📈</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-xs">
          Estatísticas
        </span>
      </Button>

      <Button
        className="group fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-xl transition-all duration-300 hover:pr-6"
        onClick={() => {
          calculateSalesData();
          setOpenSalesSheet(true);
        }}
      >
        <span className="p-4">📊</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-xs">
          Vendas & Lucro
        </span>
      </Button>

      {/* Header */}
      <div className="flex flex-col items-center justify-center h-[400px] gap-4 border border-gray-200 rounded-xl w-full sm:w-[600px] p-2">
        <div className="flex items-center gap-2 w-full justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Produtos</h1>
        </div>

        {/* Tabela de partes */}
        <PartsTable
          userId={userId} // ✅ necessário
          parts={parts}
          handleOpenEditSheet={handleOpenEditSheet}
          handleDeletePart={handleDeletePart} 
          posts={[]} 
          selectedPost={""} 
          setSelectedPost={function (): void {
            throw new Error("Function not implemented.");
          } }/>

      </div>

      <div className="flex gap-2 mt-4">
        <Button className="mt-4" onClick={() => setOpenPopup(true)}>
          + Adicionar Item
        </Button>
        <Button
          onClick={() => setOpenNotesSheet(true)}
          className="group fixed bottom-26 right-6 flex items-center gap-2 rounded-full bg-yellow-600 text-white shadow-xl transition-all duration-300 hover:pr-6"
        >
          <span className="p-4">🧾</span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-xs">
            Notas de Venda
          </span>
        </Button>
      </div>
      {openPopup && (
        <SettingsPopup
          type="posts"
          userId={session?.user?.id || ""}
          onClose={() => setOpenPopup(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* 👇 novo componente */}
      <SaleNotesSheet
        open={openNotesSheet}
        setOpen={setOpenNotesSheet}
        userId={session?.user?.id}
      />

      {/* Sheets e Drawer */}
      <EditPartSheet
        open={openEditSheet}
        setOpen={setOpenEditSheet}
        soldParts={soldParts}
        setSoldParts={setSoldParts}
        fillAllRemaining={(index) => {
          setSoldParts((prev) => {
            const updated = [...prev];
            const item = updated[index];
            if (!item) return updated;
            item.soldValue = item.part.weight - (item.part.sold || 0);
            return updated;
          });
        }}
        handleBaixa={handleBaixa}
      />

      <SalesSummarySheet
        open={openSalesSheet}
        setOpen={setOpenSalesSheet}
        salesPeriod={salesPeriod}
        setSalesPeriod={setSalesPeriod}
        salesData={salesData}
        calculateSalesData={calculateSalesData}
      />

      <SalesChartDrawer
        open={openDrawer}
        setOpen={setOpenDrawer}
        chartData={chartData}
        salesPeriod={salesPeriod}
        setSalesPeriod={setSalesPeriod}
        fetchSalesChart={fetchSalesChart}
      />
    </div>
  );
}
