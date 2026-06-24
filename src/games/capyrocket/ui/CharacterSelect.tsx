import { CHARACTERS } from "../engine/characters";

/**
 * Tela inicial CAPI WARS: o jogador escolhe uma das unidades capivara antes de
 * começar. Cada herói tem arma-assinatura e habilidade passiva próprias.
 */
export default function CharacterSelect({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="capy-select">
      <a className="capy-select__back" href="/">
        ← Jogos
      </a>
      <div className="capy-select__head">
        <div className="capy-select__title">CAPI WARS</div>
        <div className="capy-select__sub">Escolha seu herói capivara</div>
      </div>

      <div className="capy-select__grid">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="capy-card"
            style={{ borderColor: c.accentColor }}
            onClick={() => onSelect(c.id)}
          >
            <div
              className="capy-card__portrait"
              style={{ background: `radial-gradient(ellipse at 50% 35%, ${c.accentColor}55 0%, transparent 70%)` }}
            >
              <img src={c.sprite} alt={c.name} draggable={false} />
            </div>
            <div className="capy-card__name">{c.name}</div>
            <div className="capy-card__role">{c.role}</div>
            <div className="capy-card__bio">{c.bio}</div>
            <div className="capy-card__ability">{c.ability}</div>
          </button>
        ))}
      </div>

      <div className="capy-select__hint">Toque em um herói para começar • 1 toque pula</div>
    </div>
  );
}
