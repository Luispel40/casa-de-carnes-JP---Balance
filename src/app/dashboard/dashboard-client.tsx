"use client";

import { useState } from "react";
import { Button } from "@/_components/ui/button";
import { signOut } from "next-auth/react";
import { ToggleGroupButtons } from "../_components/toggleGroup/page";
import CardItem from "./card";
import CardTest from "./cardTest";

export default function DashboardClient({ user }: { user: any }) {
  const [selected, setSelected] = useState("posts"); // valor inicial

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">
        Bem-vindo, {user?.name || "Usuário"}
      </h1>

      {/* ToggleGroup controlado */}
      <ToggleGroupButtons value={selected} onChange={setSelected} />

      {/* CardItem muda conforme a seleção */}
      {/* <CardItem userId={user.id} selected={selected} /> */}
      <CardTest userId={user.id} selected={selected}/>

      <Button onClick={() => signOut()}>Sair</Button>
      
    </main>
  );
}
