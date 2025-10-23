"use client";
import { useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";

interface SettingsPopupProps {
  type: string;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export default function SettingsPopup({ type, onClose, onSubmit }: SettingsPopupProps) {
  const [formData, setFormData] = useState({ name: "", price: "", role: "" });

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-80 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4 text-center">
          Adicionar novo {type}
        </h2>

        {/* Campos dinâmicos */}
        <div className="space-y-3">
          <Input
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          {type === "posts" && (
            <Input
              type="number"
              placeholder="Preço"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          )}

          {type === "employees" && (
            <Input
              placeholder="Cargo"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          )}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
