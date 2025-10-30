"use client";

import { ChevronLeft, EllipsisIcon, Loader, Plus, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/_components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import PostItem from "../_components/post";

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

  // 🔹 Buscar posts e suas partes
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/${session.user?.id}`);
        if (!res.ok) throw new Error("Erro ao buscar posts");
        const json = await res.json();

        setPosts(json);

        // Extrair todas as partes de todos os posts
        const allParts = json.flatMap((post: any) =>
          post.parts?.map((part: any) => ({
            ...part,
            postTitle: post.title,
            postId: post.id,
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

  // 🔹 Deletar uma part
  const handleDeletePart = async (id: string) => {
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao deletar part");

      setParts((prev) => prev.filter((part) => part.id !== id));
      toast.success("Parte deletada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar parte");
    }
  };

  // 🔹 Visualizar detalhes
  const viewPart = (part: any) => {
    console.log("Parte selecionada:", part);
    toast(`Parte: ${part.name}`, {
      description: `Post: ${part.postTitle}\nPeso: ${part.weight}kg\nPreço: ${formatCurrency(part.price)}`,
    });
  };

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
      {/* Header */}
      <div className="flex items-center gap-2 w-full sm:w-96 justify-between px-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Partes</h1>
      </div>

      {/* Filtro de post */}
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
                  <tr key={part.id} className="border border-gray-300">
                    <td className="p-2 border-r">{part.name}</td>
                    <td className="p-2 border-r">{part.weight}kg</td>
                    <td className="p-2 border-r">{formatCurrency(part.price)}</td>
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
                        onClick={() => viewPart(part)}
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

        <div className="flex flex-row gap-6">
          <Button variant="outline">
            <EllipsisIcon className="mr-2" />
          </Button>
          <Button variant="outline">
            <Plus className="mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
