"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

interface UserFormProps {
  userId: string;
}

export default function UserForm({ userId }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // NOVO: Estado para mostrar o campo de input de URL
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Removida a referência ao input de arquivo e o estado base64Image
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    // image armazena APENAS o link URL ou string vazia
    image: "",
    address: "",
    enterprise: "",
    phone: "",
  });

  // 🧠 Buscar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user/${userId}`);
        if (!res.ok) throw new Error("Erro ao buscar usuário");
        const data = await res.json();

        const userImage = data.image ?? "";

        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          // O valor inicial de image no form é o link (URL) do banco.
          image: userImage,
          address: data.address ?? "",
          enterprise: data.enterprise ?? "",
          phone: data.phone ?? "",
        });

        // O preview agora sempre exibe o URL do banco.
        if (userImage) setPreview(userImage);
      } catch (err) {
        toast.error("Erro ao carregar dados do usuário");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  // 🔤 Atualizar campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    // 🧩 Máscara de telefone
    if (name === "phone") {
      value = value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }

    setForm({ ...form, [name]: value });
  };

  // NOVO: Lidar com mudança de URL da imagem
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setForm({ ...form, image: newUrl });
    setPreview(newUrl); // Atualiza o preview instantaneamente
  };

  // NOVO: Função para alternar o input de URL
  const handleToggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setForm({ ...form, image: "" }); // Remove o URL
    setShowUrlInput(false); // Esconde o input de URL
  };

  // 💾 Salvar alterações - AGORA SÓ LIDA COM URL
  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.warning("Preencha nome e e-mail antes de salvar");
      return;
    }

    try {
      setSaving(true);

      // form.image agora contém apenas o URL ou ""
      const res = await fetch(`/api/user/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Erro ao atualizar usuário");

      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <p className="text-center text-gray-500 py-6">Carregando...</p>
      ) : (
        <>
          {/* 🖼️ Imagem do usuário */}
          <div className="flex flex-col items-center gap-2 mb-4">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="User preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 transition text-white rounded-full p-1 shadow-md"
                  title="Remover imagem"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-24 h-24 border rounded-full text-gray-400">
                <Upload size={22} />
              </div>
            )}

            {/* Botão que alterna a exibição do Input de URL */}
            <Button
              variant="outline"
              onClick={handleToggleUrlInput}
              className="mt-1 text-xs"
            >
              {showUrlInput
                ? "Ocultar campo URL"
                : "Alterar ou colar link da imagem"}
            </Button>
          </div>

          {/* NOVO: Campo para colar o link da imagem (URL) - Visível por toggle */}
          {showUrlInput && (
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium">
                Link da Imagem (URL)
              </label>
              <Input
                type="url"
                name="image"
                value={form.image}
                onChange={handleImageUrlChange}
                placeholder="https://exemplo.com/sua-foto.jpg"
              />
            </div>
          )}

          {/* 🧩 Campos */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço</label>
            <Input
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Input
              name="enterprise"
              value={form.enterprise}
              onChange={handleChange}
            />
            {/* O valor de 'enteprise' em useEffect foi corrigido para 'enterprise' */}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(11) 91234-5678"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
