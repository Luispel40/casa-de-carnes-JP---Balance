"use client";

import { ToggleGroup, ToggleGroupItem } from "@/_components/ui/toggle-group";
import { DollarSign, IdCardLanyard, Settings, User } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ToggleGroupButtons({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val)}
      className="gap-2"
    >
      <ToggleGroupItem value="profile">
        <User />
        Perfil
      </ToggleGroupItem>
      <ToggleGroupItem value="posts">
        <DollarSign />
        Balanço
      </ToggleGroupItem>
      <ToggleGroupItem value="employees">
        <IdCardLanyard />
         Equipe</ToggleGroupItem>
      <ToggleGroupItem value="settings">
        <Settings />
         Configurações</ToggleGroupItem>
    </ToggleGroup>
  );
}
