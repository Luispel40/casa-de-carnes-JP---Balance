"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/_components/ui/card";

interface CardItemProps {
  userId: string;
  selected: string;
}

export default function CardItem({ userId, selected }: CardItemProps) {
  const renderContent = () => {
    switch (selected) {
      case "posts":
        return <p>📄 Aqui ficam os posts do usuário {userId}</p>;
      case "employees":
        return <p>👥 Aqui estão os funcionários do usuário {userId}</p>;
      case "settings":
        return <p>⚙️ Configurações da conta</p>;
      default:
        return <p>Selecione uma opção</p>;
    }
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Seção: {selected}</CardTitle>
        <CardDescription>
          Conteúdo relacionado a <strong>{selected}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
