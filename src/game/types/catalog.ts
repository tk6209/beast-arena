export type StatusConteudo = 'ativo' | 'pre_lancamento' | 'inativo' | 'futuro';
export type Raridade = 'comum' | 'raro' | 'epico' | 'lendario' | 'legado';
export type Elemento =
  | 'fogo' | 'gelo' | 'raio' | 'metal' | 'natureza'
  | 'sombra' | 'arcano' | 'legado';

export interface WaveMeta {
  wave: number;
  wave_nome: string;
  release_date: string;
  status: StatusConteudo;
  early_access?: boolean;
  sorteavel_admin?: boolean;
}

export interface MonstroCatalog extends WaveMeta {
  id: string;
  nome: string;
  hp: number;
  atk: number;
  def: number;
  emoji: string;
  bg1: string;
  bg2: string;
  glow: string;
  hab: string;
  habD: string;
  destaque_mensal: boolean;
  elemento: Elemento;
  raridade: Raridade;
}

export interface SwarmCatalog extends WaveMeta {
  id: string;
  nome: string;
  emoji: string;
  raridade: Raridade;
  tipo: string;
  efeito: string;
  valor: number;
  desc: string;
}

export interface CartaCatalog extends WaveMeta {
  nome: string;
  emoji: string;
  valor: number;
  custo?: number;
  desc: string;
  esp?: string;
  autoDano?: number;
  categoria: string;
}

export interface OndaCalendario {
  wave: number;
  nome: string;
  release_date: string;
  status: StatusConteudo;
  monstro_destaque: string | null;
  tema: string;
}