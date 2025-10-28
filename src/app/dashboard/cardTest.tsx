"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardAction,
} from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { ArrowRight } from "lucide-react";
import PostItem from "./_components/post";
import { NativeSelect } from "@/_components/ui/native-select";
import SettingsPopup from "_components/SettingsPopup";
import { toast } from "sonner";
import { formatCurrency } from "@/helpers/format-currency";
import Link from "next/link";

interface CardItemProps {
  userId: string;
  selected: string;
}

export default function CardTest({ userId, selected }: CardItemProps) {
  const router = useRouter();
  // 🔹 Todos os Hooks ficam aqui no topo
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // ✅ Hooks para settings
  const [selectedType, setSelectedType] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const routes: Record<string, string> = {
    posts: "/dashboard/graphics",
    employees: "/dashboard/equip",
    profile: "/dashboard/profile",
    settings: "/dashboard/settings",
  };

  // Carrega os dados
  useEffect(() => {
    if (!selected || !userId) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        let endpoint = "";

        switch (selected) {
          case "profile":
            endpoint = `/api/user/${userId}`;
            break;
          case "posts":
            endpoint = `/api/posts/${userId}`;
            break;
          case "employees":
            endpoint = `/api/employees/${userId}`;
            break;
          case "settings":
            endpoint = `/api/user/${userId}`;
            break;
          default:
            return;
        }

        const res = await fetch(endpoint);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selected, userId]);

  // Memo de categorias
  const categories = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return Array.from(
      new Set(data.map((post: any) => post.category?.name).filter(Boolean))
    );
  }, [data]);

  // Filtra posts
  const filteredPosts = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!selectedCategory) return data;
    return data.filter((post: any) => post.category?.name === selectedCategory);
  }, [data, selectedCategory]);

  const handleAdd = () => {
    if (!selectedType) return alert("Selecione um tipo antes de adicionar.");
    setIsPopupOpen(true);
  };

  // Renderização condicional
  const renderContent = () => {
    if (loading) return <p>Carregando...</p>;
    if (!data) return <p>Selecione uma categoria</p>;

    switch (selected) {
      case "profile":
        return (
          <div className="space-y-2" key={data.id}>
            <p>
              <strong>Nome:</strong> {data.name}
            </p>
            <p>
              <strong>Email:</strong> {data.email}
            </p>
            <p>
              <strong>Telefone:</strong> {data.phone}
            </p>
            <p>
              <strong>Endereço:</strong> {data.address}
            </p>
            <p>
              <strong>Empresa:</strong> {data.enteprise}
            </p>
          </div>
        );

      case "posts":
        if (!Array.isArray(data)) return <p>Nenhum post encontrado.</p>;
        return (
          <PostItem
            data={categories.map((name) => ({ id: name, title: name }))}
            onSelectCategory={setSelectedCategory}
          >
            {filteredPosts.map((post: any) => (
              <li key={post.id}>
                {post.isActive && post.title}{" "}
                {post.sellPrice &&
                  post.isActive &&
                  `— (${formatCurrency(post.sellPrice)})`}
              </li>
            ))}
          </PostItem>
        );

      case "employees":
        if (!Array.isArray(data)) return <p>Nenhum funcionário encontrado.</p>;
        return (
          <ul className="list-disc list-inside space-y-1">
            {data.map((emp: any) => (
              <li key={emp.id}>
                {emp.name} ({emp.role})
              </li>
            ))}
          </ul>
        );

      case "settings":
        return (
          <div className="space-y-3">
            <NativeSelect
              onChange={(e) => setSelectedType(e.target.value)}
              value={selectedType}
            >
              <option value="">Selecione um tipo</option>
              <option value="categories">Categoria</option>
              <option value="employees">Funcionário</option>
              <option value="posts">Item</option>
            </NativeSelect>

            <Button onClick={handleAdd} className="w-full">
              Adicionar
            </Button>

            {isPopupOpen && selectedType && (
              <SettingsPopup
                type={selectedType}
                onClose={() => setIsPopupOpen(false)}
                onSubmit={async (formData) => {
                  try {
                    // 🔹 Adiciona o userId antes de enviar
                    const body = { ...formData, userId };

                    // Define a URL conforme o tipo
                    const endpoint = `/api/${selectedType}`;

                    // console.log("📦 Enviando para:", endpoint, body);

                    const res = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });

                    if (!res.ok) {
                      const text = await res.text();
                      toast.error(`❌ Erro ao criar ${selectedType}: ${text}`);
                      // console.error("❌ Erro ao criar item:", text);
                      return;
                    }

                    const json = await res.json();
                    toast.success(`Criado ${selectedType} com sucesso!`);
                    // console.log("✅ Criado com sucesso:", json);

                    // Se quiser, atualiza a lista local:
                    setData((prev: any) =>
                      Array.isArray(prev) ? [...prev, json] : [json]
                    );
                  } catch (err) {
                    toast.error(`⚠️ Falha ao criar ${selectedType}: ${err}`);
                    // console.error("⚠️ Falha ao salvar:", err);
                  }
                }}
                userId={userId}
              />
            )}
          </div>
        );

      default:
        return <p>Selecione uma opção</p>;
    }
  };

  return (
    <Card className="w-96 min-h-[400px] max-h-[400px]">
      <CardHeader>
        <CardTitle>{data?.name}</CardTitle>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(routes[selected] || "/dashboard")}
          >
            <ArrowRight />
            <Link href="/equip"></Link>
          </Button>
        </CardAction>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">{renderContent()}</CardContent>
    </Card>
  );
}
