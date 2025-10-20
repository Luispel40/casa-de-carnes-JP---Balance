import { Bold, Italic, Underline } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/_components/ui/toggle-group"

export function ToggleGroupButtons() {
  return (
    <ToggleGroup type="single" variant="outline">
      <ToggleGroupItem value="perfil" aria-label="Toggle profile">
        Gerenciar conta
      </ToggleGroupItem>
      <ToggleGroupItem value="balanço" aria-label="Toggle balance">
        Meu Balanço
      </ToggleGroupItem>
      <ToggleGroupItem value="histórico" aria-label="Toggle history">
        Meu histórico
      </ToggleGroupItem>
      <ToggleGroupItem value="equipe" aria-label="Toggle team">
        Minha equipe
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
