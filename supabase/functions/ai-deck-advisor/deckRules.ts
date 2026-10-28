export type Owned={card_key:string;card_data:Record<string,unknown>;quantity:number};
export type Style="aggro"|"control"|"defensive"|"combo";
export function validDeck(keys:unknown,pool:Owned[]):keys is string[]{
  if(!Array.isArray(keys)||keys.length!==10||!keys.every(x=>typeof x==="string"))return false;
  const owned=new Map(pool.map(row=>[row.card_key,row]));const counts=new Map<string,number>();
  for(const key of keys){const row=owned.get(key);if(!row)return false;const next=(counts.get(key)||0)+1;
    if(next>Math.min(2,row.quantity))return false;counts.set(key,next);}
  return true;
}
export function fallback(pool:Owned[],style:Style):string[]{
  const weights:Record<Style,Record<string,number>>={
    aggro:{ataque:7,defesa:2,cura:1,desafio:4},control:{ataque:3,defesa:6,cura:4,desafio:6},
    defensive:{ataque:2,defesa:8,cura:7,desafio:3},combo:{ataque:5,defesa:3,cura:2,desafio:8}};
  const sorted=[...pool].sort((a,b)=>((weights[style][String(b.card_data.tipo)]||0)*100-(Number(b.card_data.custo)||2)*5)
    -((weights[style][String(a.card_data.tipo)]||0)*100-(Number(a.card_data.custo)||2)*5)||a.card_key.localeCompare(b.card_key));
  const keys:string[]=[];for(const card of sorted){for(let i=0;i<Math.min(2,card.quantity);i++){if(keys.length===10)return keys;keys.push(card.card_key);}}
  return keys;
}
