"use client"

import { Calendar } from "@/_components/ui/calendar";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import PostItem from "../_components/post";
import FooterPage from "@/app/_components/footer/page";

// Função Helper para formatar moeda (usando Intl.NumberFormat para o Real Brasileiro)
// Foi adicionada pois estava faltando no código original.
const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
};


export default function GraphicsPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    // 🚨 CORREÇÃO 1: Adicionado o estado para 'categories'
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
        return posts.filter((post: any) => post.category?.name === selectedCategory);
    }, [posts, selectedCategory]);

    // O filterPeriod não estava fazendo nada, apenas retornando o resultado do filter
    // Mantenho a função, mas ela deve ser usada para atualizar um estado ou renderização.
    // Atualmente, ela não tem um efeito visível, a menos que seja chamada e seu retorno usado.
    const filterPeriod = (period: string) => {
        // Se a intenção é filtrar e retornar, a função está OK, mas sem efeito na renderização
        return posts.filter((post) => post.createdAt === period);
    }

    if (loading || !session) {
        return (
            <p className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader className="animate-spin" />
                Carregando...
            </p>
        );
    }

    // A verificação de !posts não é mais necessária se posts for inicializado como [] (array vazio).
    // Mas uma verificação de array vazio é mais clara.
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
                <h1>Vamos ao Balanço!</h1>
                {/* <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-lg border"
                /> */}
           <div className="flex flex-col items-center justify-center min-h-96 max-h-96 gap-4 border rounded-lg p-6">
             {categories.length > 0 && (
                <PostItem
                    // Assumindo que 'categories' é um array de strings ou objetos simples com um 'name'
                    data={categories.map((category) => ({ id: category.id || category, title: category.name || category }))}
                    onSelectCategory={setSelectedCategory}
                >
                    <table className="w-full border border-gray-300 p-6">
                        <tr>
                            <th>Título</th>
                            <th>Peso</th>
                            <th>Valor</th>
                        </tr>
                        {filteredPosts.map((post: any) => (
                        <tr key={post.id}
                            className="w-full border border-gray-300 p-6">
                                    <td>{post.title}</td>
                                    <td>{post.weight}</td>
                                    <td>{post.price}</td>
                        </tr>
                    ))}
                    <tfoot></tfoot>
                    </table>
                </PostItem>
            )}
           </div>
            </div>
            <FooterPage />
        </div>
    )
}

// 🚨 CORREÇÃO 3: Removida a função 'setLoading' duplicada e incorreta que estava no final do arquivo.