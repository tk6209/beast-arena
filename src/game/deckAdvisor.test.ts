import {describe,it,expect} from "vitest";
import {validDeck,fallback,type Owned} from "../../supabase/functions/ai-deck-advisor/deckRules";

const pool:Owned[]=Array.from({length:10},(_,i)=>({
 card_key:"card"+i,card_data:{tipo:i<6?"ataque":"defesa",custo:i%3+1},quantity:2,
}));
describe("AI deck ownership anti-forgery",()=>{
 it("accepts exactly ten genuinely owned slots",()=>expect(validDeck(pool.map(x=>x.card_key),pool)).toBe(true));
 it("rejects invented cards even when there are ten",()=>expect(validDeck([...pool.slice(0,9).map(x=>x.card_key),"fake"],pool)).toBe(false));
 it("rejects three copies of the same card",()=>expect(validDeck(["card0","card0","card0",...pool.slice(1,8).map(x=>x.card_key)],pool)).toBe(false));
 it("rejects deck size different from ten",()=>expect(validDeck(pool.slice(0,9).map(x=>x.card_key),pool)).toBe(false));
 it("rejects more copies than owned",()=>{
   const p=[{...pool[0],quantity:1},...pool.slice(1)];
   expect(validDeck(["card0","card0",...pool.slice(1,9).map(x=>x.card_key)],p)).toBe(false);
 });
 it("creates a deterministic deck with only allowed cards",()=>{
   const deck=fallback(pool,"aggro");
   expect(validDeck(deck,pool)).toBe(true);
 });
 it("does not mutate a user's input collection",()=>{
   const before=JSON.stringify(pool);fallback(pool,"control");expect(JSON.stringify(pool)).toBe(before);
 });
});
