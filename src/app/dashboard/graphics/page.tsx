"use client";

import { ChevronLeft, EllipsisIcon, Loader, Plus, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import PostItem from "../_components/post";
import { Button } from "@/_components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

// Função Helper para formatar moeda (usando Intl.NumberFormat para o Real Brasileiro)
// Foi adicionada pois estava faltando no código original.
const formatCurrency = (amount: number): string => {
  if (typeof amount !== "number") return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

export default function GraphicsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;

    setLoading(true);
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/posts/${session.user?.id}`);
        if (!res.ok) throw new Error("Erro ao buscar posts");
        const json = await res.json();
        setPosts(json);
      } catch (err) {
        console.error("Erro ao buscar posts:", err);
      }
      // Não chame setLoading(false) aqui, pois fetchCategories também o faz.
      // Para evitar piscar, chame no final do useEffect ou no finally de fetchCategories.
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/categories/${session.user?.id}`);
        if (!res.ok) throw new Error("Erro ao buscar categorias");
        const json = await res.json();
        setCategories(json); // 💡 CORREÇÃO: setCategories agora existe
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      } finally {
        // Chama setLoading(false) apenas no final de todas as operações assíncronas
        setLoading(false);
      }
    };

    fetchPosts();
    fetchCategories();
  }, [session]);

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    if (!selectedCategory) return posts;
    return posts.filter(
      (post: any) => post.category?.name === selectedCategory
    );
  }, [posts, selectedCategory]);

  
  const filterPeriod = (period: string) => {
    // Se a intenção é filtrar e retornar, a função está OK, mas sem efeito na renderização
    return posts.filter((post) => post.createdAt === period);
  };

  const handleDeletePost = async (id: string) => {
  try {
    const res = await fetch(`/api/posts/${session?.user?.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Erro ao deletar post");
    setPosts((prev) => prev.filter((post) => post.id !== id));
  } catch (err) {
    toast.error("Erro ao deletar post" + err);
  }
  toast.success("Item deletado com sucesso!");
};

const viewPost = (post: any) => {
  console.log(post);
};

  if (loading || !session) {
    return (
      <p className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader className="animate-spin" />
        Carregando...
      </p>
    );
  }

 
  if (posts.length === 0) {
    return (
      <p className="flex flex-col items-center justify-center min-h-screen gap-4">
        Nenhum post encontrado.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {/* TODO: Adicionar o componente Calendar
         <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-lg border"
                /> */}
          <div className="flex items-center gap-2 w-full sm:w-96 justify-between px-6">
            <Button variant="outline" asChild>
            <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>

            <h1 className="text-2xl font-bold">Graficos</h1>
          </div>
        <div className="flex flex-col items-center justify-center min-h-96 max-h-96 gap-4 border rounded-lg p-6">
          {categories.length > 0 && (
            <PostItem
              // Assumindo que 'categories' é um array de strings ou objetos simples com um 'name'
              data={categories.map((category) => ({
                id: category.id || category,
                title: category.name || category,
              }))}
              onSelectCategory={setSelectedCategory}
            >
              <div className="max-h-[200px] h-[200px] overflow-auto">
                <table className="lg:min-w-lg min-w-full w-[300px] border border-gray-300 p-6 text-sm">
                <tbody className="w-full">
                  <tr>
                    <th>Título</th>
                    <th>Peso</th>
                    <th>Valor</th>
                  </tr>
                  {filteredPosts.map((post: any) => (
                    <tr
                      key={post.id}
                      className="w-full border border-gray-300 p-6"
                    >
                      <td className="p-2 border-r-2 border-gray-300">
                        {post.title}
                      </td>
                      <td className="p-2 border-r-2 border-gray-300">
                        {post.weight}kg
                      </td>
                      <td className="p-2 border-r-2 border-gray-300">
                        {formatCurrency(post.price)}
                      </td>
                      <td>
                        <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash />
                        </Button>
                        <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => viewPost(post)}
                        >
                          <Plus />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot></tfoot>
              </table>
              </div>
            </PostItem>
          )}
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
      
    </div>
  );
}
