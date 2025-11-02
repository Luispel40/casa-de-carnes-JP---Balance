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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
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

        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          image: data.image ?? "",
          address: data.address ?? "",
          enterprise: data.enteprise ?? "",
          phone: data.phone ?? "",
        });

        if (data.image) setPreview(data.image);
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

  // 🖼️ Upload de imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setForm({ ...form, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setForm({ ...form, image: "" });
  };

  // 💾 Salvar alterações
  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.warning("Preencha nome e e-mail antes de salvar");
      return;
    }

    try {
      setSaving(true);
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
          <div className="flex flex-col items-center gap-2">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="User preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
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

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 text-xs"
            >
              Alterar imagem
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

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
            <Input name="address" value={form.address} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Input
              name="enterprise"
              value={form.enterprise}
              onChange={handleChange}
            />
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
