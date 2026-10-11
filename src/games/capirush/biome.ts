/** Biomas do Capi Rush: a corrida alterna entre CapyCity (noite neon) e a Selva Ancestral. */
export const BIOME_CYCLE = 1600; // metros por ciclo completo
export const BIOME_CITY_END = 700;
export const BIOME_JUNGLE_START = 800;
export const BIOME_JUNGLE_END = 1500;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 0 = CapyCity, 1 = Selva Ancestral; valores intermediários são a transição (100 m). */
export function biomeAt(distance: number): number {
  const c = ((distance % BIOME_CYCLE) + BIOME_CYCLE) % BIOME_CYCLE;
  if (c < BIOME_CITY_END) return 0;
  if (c < BIOME_JUNGLE_START) return smooth(BIOME_CITY_END, BIOME_JUNGLE_START, c);
  if (c < BIOME_JUNGLE_END) return 1;
  return 1 - smooth(BIOME_JUNGLE_END, BIOME_CYCLE, c);
}
