const monsterUrls = import.meta.glob("./assets/monsters/*.webp", { eager: true, import: "default" }) as Record<string, string>;
const cardUrls = import.meta.glob("./assets/cards/*.webp", { eager: true, import: "default" }) as Record<string, string>;

const byName = (m: Record<string, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k.split("/").pop()!.replace(".webp", ""), v]));

export const MONSTER_ART: Record<string, string> = byName(monsterUrls);
export const CARD_ART: Record<string, string> = byName(cardUrls);

/** Art for a card: signature cards use the monster portrait. */
export function cardArt(arte: string): string {
  return CARD_ART[arte] ?? MONSTER_ART[arte] ?? "";
}

/** Monsters that hover instead of standing on the floor. */
export const FLYING = new Set(["volt", "phantom", "morcego"]);
