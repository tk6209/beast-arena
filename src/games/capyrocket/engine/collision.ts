import type { Rect } from "./types";

/**
 * Teste de sobreposição AABB (axis-aligned bounding box).
 * Bordas apenas encostadas NÃO contam como sobreposição (comparação estrita),
 * o que evita acertos "de raspão" no pixel exato da borda.
 */
export function aabbOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
