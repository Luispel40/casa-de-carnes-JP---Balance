export function playSound(src: string) {
  const audio = new Audio(src);
  audio.volume = 0.5; // opcional
  audio.play().catch((err) => console.warn("Falha ao tocar som:", err));
}