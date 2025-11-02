"use client";

import { useState } from "react";
import { ToggleGroupButtons } from "../_components/toggleGroup/page";
import CardItem from "./card";

export default function DashboardClient({ user }: { user: any }) {
  const [selected, setSelected] = useState("profile"); // valor inicial

  return (
    <main className="flex flex-col items-center justify-center">

      <ToggleGroupButtons value={selected} onChange={setSelected} /> 
      <CardItem userId={user.id} selected={selected} />
      
    </main>
  );
}
