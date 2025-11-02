"use client";

import { useEffect, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { toast } from "sonner";

interface UserFormProps {
  userId: string;
}

export default function UserForm({ userId }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    image: "",
    address: "",
    enterprise: "",
    phone: "",
  });

  // 🧠 Buscar dados do usuário ao carregar
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
          enterprise: data.enteprise ?? "", // note: no schema é 'enteprise'
          phone: data.phone ?? "",
        });
      } catch (err) {
        toast.error("Erro ao carregar dados do usuário");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  // 🖊️ Atualizar campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 💾 Salvar alterações
  const handleSave = async () => {
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
      console.error(err);
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Imagem (URL)</label>
            <Input name="image" value={form.image} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço</label>
            <Input name="address" value={form.address} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Input name="enterprise" value={form.enterprise} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input name="phone" value={form.phone} onChange={handleChange} />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </>
      )}
    </div>
  );
}
