"use client";

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
import { Edit } from "lucide-react";
import PostItem from "./_components/post";
import { NativeSelect } from "@/_components/ui/native-select";
import SettingsPopup from "_components/SettingsPopup";

interface CardItemProps {
  userId: string;
  selected: string;
}

export default function CardTest({ userId, selected }: CardItemProps) {
  // 🔹 Todos os Hooks ficam aqui no topo
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // ✅ Hooks para settings
  const [selectedType, setSelectedType] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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
        console.log("Buscando endpoint:", endpoint);
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

  // ✅ Funções para o popup
  const handleAdd = () => {
    if (!selectedType) return alert("Selecione um tipo antes de adicionar.");
    setIsPopupOpen(true);
  };

  const handleSubmit = (formData: any) => {
    console.log("Novo item adicionado:", selectedType, formData);
    setIsPopupOpen(false);
    // Aqui você pode fazer um POST para o backend (ex: /api/{selectedType})
  };

  // Renderização condicional
  const renderContent = () => {
    if (loading) return <p>Carregando...</p>;
    if (!data) return <p>Selecione uma categoria</p>;

    switch (selected) {
      case "profile":
        return (
          <div className="space-y-2" key={data.id}>
            <p><strong>Nome:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Telefone:</strong> {data.phone}</p>
            <p><strong>Endereço:</strong> {data.address}</p>
            <p><strong>Empresa:</strong> {data.enteprise}</p>
          </div>
        );

      case "posts":
        if (!Array.isArray(data)) return <p>Nenhum post encontrado.</p>;
        return (
          <PostItem
            data={categories.map(name => ({ id: name, title: name }))}
            onSelectCategory={setSelectedCategory}
          >
            {filteredPosts.map((post: any) => (
              <li key={post.id}>
                {post.title} — {post.category?.name} (${post.price})
              </li>
            ))}
          </PostItem>
        );

      case "employees":
        if (!Array.isArray(data)) return <p>Nenhum funcionário encontrado.</p>;
        return (
          <ul className="list-disc list-inside space-y-1">
            {data.map((emp: any) => (
              <li key={emp.id}>{emp.name} ({emp.role})</li>
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

            {isPopupOpen && (
              <SettingsPopup
                type={selectedType}
                onClose={() => setIsPopupOpen(false)}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        );

      default:
        return <p>Selecione uma opção</p>;
    }
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Informações</CardTitle>
        <CardAction>
          <Button size="sm" variant="outline">
            <Edit />
          </Button>
        </CardAction>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
