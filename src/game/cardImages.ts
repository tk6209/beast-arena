import garraDeAco from "@/assets/cards/garra_de_aco.png";
import pancada from "@/assets/cards/pancada.png";
import puloRapido from "@/assets/cards/pulo_rapido.png";
import soproCongelante from "@/assets/cards/sopro_congelante.png";
import raizExplosiva from "@/assets/cards/raiz_explosiva.png";
import explode from "@/assets/cards/explode.png";
import tudoOuNada from "@/assets/cards/tudo_ou_nada.png";
import escudoRapido from "@/assets/cards/escudo_rapido.png";
import carapaca from "@/assets/cards/carapaca.png";
import esquiva from "@/assets/cards/esquiva.png";
import barreira from "@/assets/cards/barreira.png";
import evolucao from "@/assets/cards/evolucao.png";
import swarm from "@/assets/cards/swarm.png";
import desafio from "@/assets/cards/desafio.png";
import poderzinho from "@/assets/cards/poderzinho.png";

/** Maps card nome → illustration asset */
const CARD_IMAGES: Record<string, string> = {
  "Garra de Aço": garraDeAco,
  "Pancada": pancada,
  "Pulo Rápido": puloRapido,
  "Sopro Congelante": soproCongelante,
  "Raiz Explosiva": raizExplosiva,
  "EXPLODE": explode,
  "Tudo ou Nada": tudoOuNada,
  "Escudo Rápido": escudoRapido,
  "Carapaça": carapaca,
  "Esquiva": esquiva,
  "Barreira": barreira,
};

/** Fallback by card tipo */
const TYPE_FALLBACK: Record<string, string> = {
  evolucao: evolucao,
  swarm: swarm,
  desafio: desafio,
  poderzinho: poderzinho,
};

export function getCardImage(nome: string, tipo: string): string | null {
  return CARD_IMAGES[nome] || TYPE_FALLBACK[tipo] || null;
}
