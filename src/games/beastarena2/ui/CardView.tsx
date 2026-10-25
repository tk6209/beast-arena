import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cardArt } from "../assets";
import { ELEMENTO_INFO } from "../engine/data";
import type { CardDef } from "../engine/types";

const KIND_ICON: Record<CardDef["kind"], string> = { ataque: "⚔️", defesa: "🛡️", suporte: "✨" };

export interface CardViewProps extends HTMLAttributes<HTMLDivElement> {
  card: CardDef;
  custo?: number;
  jogavel?: boolean;
  big?: boolean;
  style?: CSSProperties;
}

export const CardView = forwardRef<HTMLDivElement, CardViewProps>(function CardView(
  { card, custo, jogavel = true, big, className = "", style, ...rest },
  ref,
) {
  const c = custo ?? card.custo;
  const desconto = c < card.custo;
  const sig = card.raridade === "assinatura";
  return (
    <div
      ref={ref}
      className={`ba2-card ba2-k-${card.kind} ba2-r-${card.raridade} ${jogavel ? "" : "ba2-card-off"} ${big ? "ba2-card-big" : ""} ${className}`}
      style={style}
      {...rest}
    >
      <div className="ba2-card-inner">
        <div className={`ba2-card-art ${sig ? "ba2-card-art-sig" : ""}`}>
          <img src={cardArt(card.arte)} alt="" draggable={false} />
          {card.elemento && (
            <span className="ba2-card-el" style={{ background: ELEMENTO_INFO[card.elemento].cor }}>
              {ELEMENTO_INFO[card.elemento].icone}
            </span>
          )}
        </div>
        <div className="ba2-card-name">{card.nome}</div>
        <div className="ba2-card-text">{card.texto}</div>
      </div>
      <div className={`ba2-card-cost ${desconto ? "ba2-cost-down" : ""}`}>{c}</div>
      <div className="ba2-card-kind">{KIND_ICON[card.kind]}</div>
      {sig && <div className="ba2-card-holo" />}
    </div>
  );
});
