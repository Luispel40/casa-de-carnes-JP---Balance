"use client";

import { useEffect, useState } from "react";
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

interface CardItemProps {
  userId: string;
  selected: string;
}

export default function CardTest({ userId, selected }: CardItemProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
          case "categories":
            endpoint = `/api/categories/${userId}`;
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
          <PostItem data={data} /> 
        );

      case "employees":
        if (!Array.isArray(data)) return <p>Nenhum funcionário encontrado.</p>;
        return (
          <ul className="list-disc list-inside space-y-1">
            {data.map((emp: any) => (
              <li key={emp.id}>
                {emp.name}
              </li>
            ))}
          </ul>
        );

      case "categories":
        if (!Array.isArray(data)) return <p>Nenhum funcionário encontrado.</p>;
        return (
          <ul className="list-disc list-inside space-y-2">
            {data.map((cat: any) => (
              <li key={cat.id}>
                <strong>{cat.name}</strong> — {cat.posts.length} produtos
              </li>
            ))}
          </ul>
        );

      default:
        return <p>Selecione uma opção</p>;
    }
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Seção: {selected}</CardTitle>
        <CardAction>
            <Button size="sm" variant="outline">
                <Edit /> 
            </Button>
        </CardAction>
        <CardDescription>
          Dados relacionados a <strong>{selected}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
