"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/_components/ui/button";
import { ChevronLeft, DollarSign, Plus, Trash, Loader } from "lucide-react";
import { toast } from "sonner";


import SettingsPopup from "_components/SettingsPopup";
import PartsTable from "./_components/PartsTable";
import EditPartSheet from "./_components/EditPartSheet";
import SalesSummarySheet from "./_components/SalesSummarySheet";
import SalesChartDrawer from "./_components/SalesChartDrawer";

// Helper
const formatCurrency = (amount: number) => {
  if (typeof amount !== "number") return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
};

export default function GraphicsPartsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [selectedPost, setSelectedPost] = useState<string>("");

  // Sheets & Drawer
  const [openSalesSheet, setOpenSalesSheet] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<"hour"|"today"|"week"|"month"|"year"|"ever">("today");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Edit sheet
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [soldValue, setSoldValue] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);

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

        const allParts = json.flatMap((post: any) =>
          post.parts?.map((part: any) => ({
            ...part,
            postTitle: post.title,
            postId: post.id,
            postSold: post.sold || 0,
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
  const filteredParts = selectedPost ? parts.filter(p => p.postId === selectedPost) : parts;

  // Deletar parte
  const handleDeletePart = async (id: string) => {
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar part");
      setParts(prev => prev.filter(p => p.id !== id));
      toast.success("Parte deletada com sucesso!");
    } catch {
      toast.error("Erro ao deletar parte");
    }
  };

  // Abrir sheet de edição
  const openEditSheet = (part: any) => {
    setSelectedPart(part);
    setSoldValue(0);
    setSellPrice(part.sellPrice || 0);
    setOpenSheet(true);
  };

  const fillAllRemaining = () => {
    if (!selectedPart) return;
    setSoldValue(selectedPart.weight - (selectedPart.sold || 0));
  };

  const handleBaixa = async () => {
    if (!selectedPart || soldValue <= 0) {
      toast.error("Informe uma quantidade válida para dar baixa.");
      return;
    }

    const restante = selectedPart.weight - (selectedPart.sold || 0);
    if (soldValue > restante) {
      toast.error(`Você não pode vender mais que ${restante}kg.`);
      return;
    }

    try {
      const partRes = await fetch(`/api/parts/${selectedPart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sold: (selectedPart.sold || 0) + soldValue, sellPrice }),
      });
      if (!partRes.ok) throw new Error("Erro ao atualizar parte");
      const updatedPart = await partRes.json();

      const totalPrice = soldValue * sellPrice;
      const profit = (sellPrice - (selectedPart.price || 0)) * soldValue;
      await fetch(`/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId: selectedPart.id, quantity: soldValue, totalPrice, profit }),
      });

      await fetch(`/api/posts/${session?.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPart.postId, sold: (selectedPart.postSold || 0) + soldValue }),
      });

      setParts(prev => prev.map(p => p.id === updatedPart.id ? updatedPart : p));
      toast.success("Baixa registrada com sucesso!");
      setOpenSheet(false);
    } catch {
      toast.error("Erro ao registrar baixa");
    }
  };

  // Criar novo post
  const handleCreatePost = async (data: any) => {
    try {
      const res = await fetch(`/api/posts${session?.user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar item");
      const newPost = await res.json();
      setPosts(prev => [...prev, newPost]);
      toast.success("Item criado com sucesso!");
    } catch {
      toast.error("Erro ao criar item");
    }
  };

  // Calcular vendas e lucro
  const calculateSalesData = () => {
    const now = new Date();
    const filtered = parts.filter(part => {
      const createdAt = new Date(part.createdAt || now);
      switch (salesPeriod) {
        case "hour": { const d = new Date(now); d.setHours(now.getHours()-1); return createdAt>=d }
        case "today": return createdAt.toDateString()===now.toDateString();
        case "week": { const d = new Date(now); d.setDate(now.getDate()-7); return createdAt>=d }
        case "month": return createdAt.getMonth()===now.getMonth() && createdAt.getFullYear()===now.getFullYear();
        case "year": return createdAt.getFullYear()===now.getFullYear();
        default: return true;
      }
    });

    const summary = filtered.reduce((acc: any, part: any) => {
      const totalSales = (part.sold || 0) * (part.sellPrice || 0);
      const profit = (part.sellPrice - (part.price || 0)) * (part.sold || 0);
      const existing = acc.find((a:any)=>a.postTitle===part.postTitle);
      if (existing) { existing.totalSales+=totalSales; existing.profit+=profit }
      else acc.push({postTitle: part.postTitle, totalSales, profit});
      return acc;
    }, []);
    summary.sort((a:any,b:any)=>b.profit-a.profit);
    setSalesData(summary);
  };

  // Buscar dados do gráfico
  const fetchSalesChart = async () => {
  try {
    const res = await fetch("/api/sales");
    if (!res.ok) throw new Error("Erro ao buscar vendas");
    const sales = await res.json();

    const now = new Date();

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

    // ✅ Aqui sim criamos a summary fora do reduce e ordenamos depois
    const summary = filtered.reduce((acc: any, s: any) => {
      const existing = acc.find((a: any) => a.partName === s.partName);
      if (existing) {
        existing.totalSales += s.totalPrice;
        existing.profit += s.profit;
      } else {
        acc.push({
          partName: s.partName,
          totalSales: s.totalPrice,
          profit: s.profit,
        });
      }
      return acc;
    }, []);

    summary.sort((a: any, b: any) => b.profit - a.profit);
    setChartData(summary);
  } catch (err) {
    console.error("Erro ao carregar gráfico de vendas:", err);
    toast.error("Erro ao carregar dados de vendas");
  }
};


  if(loading||!session) return (
    <p className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader className="animate-spin" /> Carregando...
    </p>
  );
  if(parts.length===0) return (
    <p className="flex flex-col items-center justify-center min-h-screen gap-4">
      Nenhuma parte encontrada.
    </p>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">

      <Button className="fixed bottom-24 right-6 rounded-full p-4 shadow-xl bg-green-600 text-white"
        onClick={()=>{fetchSalesChart(); setOpenDrawer(true)}}>📈 Estatísticas de Vendas</Button>

      <Button className="fixed bottom-6 right-6 rounded-full p-4 shadow-xl bg-blue-600 text-white"
        onClick={()=>{calculateSalesData(); setOpenSalesSheet(true)}}>📊 Vendas & Lucro</Button>

      {/* Header */}
      <div className="flex items-center gap-2 w-full sm:w-96 justify-between px-6">
        <Button variant="outline" asChild><Link href="/dashboard"><ChevronLeft className="mr-2 h-4 w-4"/></Link></Button>
        <h1 className="text-2xl font-bold">Partes</h1>
      </div>

      {/* Tabela de partes */}
      <PartsTable
        posts={posts}
        parts={parts}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        openEditSheet={openEditSheet}
        handleDeletePart={handleDeletePart}
      />

      <Button className="mt-4" onClick={()=>setOpenPopup(true)}>+ Adicionar Item</Button>
      {openPopup && <SettingsPopup type="posts" userId={session?.user?.id||""} onClose={()=>setOpenPopup(false)} onSubmit={handleCreatePost}/>}

      {/* Sheets e Drawer */}
      <EditPartSheet
        open={openSheet}
        setOpen={setOpenSheet}
        selectedPart={selectedPart}
        soldValue={soldValue}
        setSoldValue={setSoldValue}
        sellPrice={sellPrice}
        setSellPrice={setSellPrice}
        fillAllRemaining={fillAllRemaining}
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
