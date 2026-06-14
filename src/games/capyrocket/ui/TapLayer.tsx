/**
 * Camada de toque: a tela inteira é o botão de pular (único controle do jogo).
 * Usa pointerdown pra latência mínima; preventDefault evita scroll/zoom.
 */
export default function TapLayer({ onTap }: { onTap: () => void }) {
  return (
    <div
      className="capy-tap-layer"
      aria-hidden="true"
      onPointerDown={(e) => {
        e.preventDefault();
        onTap();
      }}
    />
  );
}
