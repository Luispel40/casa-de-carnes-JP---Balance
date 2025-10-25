"use client";

import { useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/_components/ui/card";

interface SettingsPopupProps {
  type: string;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export default function SettingsPopup({ type, onClose, onSubmit }: SettingsPopupProps) {
  const [formData, setFormData] = useState<any>({});

  // Atualiza os campos conforme o tipo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const renderFields = () => {
    switch (type) {
      case "categories":
        return (
          <>
            <Input
              name="name"
              placeholder="Nome da Categoria"
              onChange={handleChange}
            />
            <Input
              name="description"
              placeholder="Descrição (opcional)"
              onChange={handleChange}
            />
          </>
        );

      case "employees":
        return (
          <>
            <Input name="name" placeholder="Nome do Funcionário" onChange={handleChange} />
            <Input name="role" placeholder="Cargo" onChange={handleChange} />
            <Input name="email" placeholder="E-mail" onChange={handleChange} />
          </>
        );

      case "posts":
        return (
          <>
            <Input name="title" placeholder="Título do Post" onChange={handleChange} />
            <Input name="price" placeholder="Preço" type="number" onChange={handleChange} />
            <Input name="category" placeholder="Categoria" onChange={handleChange} />
          </>
        );

      default:
        return <p className="text-sm text-gray-500">Selecione um tipo válido.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Adicionar {type}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderFields()}
          <Button className="w-full" onClick={handleSubmit}>
            Salvar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
