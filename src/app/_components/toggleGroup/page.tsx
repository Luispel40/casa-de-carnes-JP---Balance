"use client";

import { ToggleGroup, ToggleGroupItem } from "@/_components/ui/toggle-group";

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
      <ToggleGroupItem value="posts">📄 Posts</ToggleGroupItem>
      <ToggleGroupItem value="employees">👥 Funcionários</ToggleGroupItem>
      <ToggleGroupItem value="settings">⚙️ Configurações</ToggleGroupItem>
    </ToggleGroup>
  );
}
