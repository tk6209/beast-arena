import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
// AI Deck Advisor: authenticated, server-verified collection, validated model output.
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Content-Type":"application/json"};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
type Owned={card_key:string;card_data:Record<string,unknown>;quantity:number};
type Style="aggro"|"control"|"defensive"|"combo";
const styles:Style[]=["aggro","control","defensive","combo"];
const monsters=new Set(["panther","banana","macaco","morcego","sprouts","drako","crystal","phantom","tsunami","volt"]);
function validDeck(keys:unknown,pool:Owned[]):keys is string[]{
  if(!Array.isArray(keys)||keys.length!==10||!keys.every(x=>typeof x==="string"))return false;
  const owned=new Map(pool.map(row=>[row.card_key,row]));const counts=new Map<string,number>();
  for(const key of keys){const row=owned.get(key);if(!row)return false;const next=(counts.get(key)||0)+1;
    if(next>Math.min(2,row.quantity))return false;counts.set(key,next);}
  return true;
}
function fallback(pool:Owned[],style:Style){
  const weights:Record<Style,Record<string,number>>={
    aggro:{ataque:7,defesa:2,cura:1,desafio:4},control:{ataque:3,defesa:6,cura:4,desafio:6},
    defensive:{ataque:2,defesa:8,cura:7,desafio:3},combo:{ataque:5,defesa:3,cura:2,desafio:8}};
  const sorted=[...pool].sort((a,b)=>((weights[style][String(b.card_data.tipo)]||0)*100-(Number(b.card_data.custo)||2)*5)
    -((weights[style][String(a.card_data.tipo)]||0)*100-(Number(a.card_data.custo)||2)*5)||a.card_key.localeCompare(b.card_key));
  const keys:string[]=[];for(const card of sorted){for(let i=0;i<Math.min(2,card.quantity);i++){if(keys.length===10)return keys;keys.push(card.card_key);}}
  return keys;
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return reply(405,{error:"method_not_allowed"});
  const auth=req.headers.get("Authorization");if(!auth?.startsWith("Bearer "))return reply(401,{error:"authentication_required"});
  try{
    const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const scoped=createClient(url,anon,{global:{headers:{Authorization:auth}}});
    const {data:verified,error:tokenError}=await scoped.auth.getClaims(auth.slice(7));
    const uid=verified?.claims?.sub as string|undefined;
    if(tokenError||!uid)return reply(401,{error:"authentication_required"});
    const input=await req.json();const style=input?.playStyle as Style;const monsterId=input?.monsterId as string;
    if(!styles.includes(style)||!monsters.has(monsterId))return reply(422,{error:"invalid_playstyle_or_monster"});
    const sb=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:monster,error:monsterError}=await sb.from("user_inventory").select("item_key")
      .eq("user_id",uid).eq("item_type","monster").eq("item_key",monsterId).maybeSingle();
    if(monsterError)return reply(503,{error:"inventory_unavailable"});
    if(!monster&&!["panther","banana"].includes(monsterId))return reply(403,{error:"monster_not_owned"});
    const {data:cards,error:cardsError}=await sb.from("user_cards").select("card_key,card_data,quantity")
      .eq("user_id",uid).limit(200);
    if(cardsError)return reply(503,{error:"collection_unavailable"});
    const selected=input.preferredCardKeys;
    if(selected!=null&&(!Array.isArray(selected)||selected.length>200||
      selected.some((x:unknown)=>typeof x!=="string"||x.length>100)))return reply(422,{error:"invalid_card_filter"});
    const whitelist=new Set<string>(selected||[]);
    const pool=(cards as Owned[]||[]).filter(c=>Number.isInteger(c.quantity)&&c.quantity>0&&
      (selected==null||whitelist.has(c.card_key)));
    if(pool.reduce((n,c)=>n+Math.min(2,c.quantity),0)<10)
      return reply(422,{error:"insufficient_owned_cards",message:"Você precisa de 10 cartas válidas na coleção."});
    let suggestion:Record<string,unknown>|null=null;
    let source:"ai_gateway"|"deterministic_fallback"="deterministic_fallback";
    const endpoint=Deno.env.get("AI_GATEWAY_URL"),key=Deno.env.get("LOVABLE_API_KEY"),model=Deno.env.get("AI_GATEWAY_MODEL");
    if(endpoint&&key&&model){
      const prompt={monsterId,style,deck_size:10,max_copies:2,cards:pool.map(c=>({key:c.card_key,
        quantity:c.quantity,name:c.card_data.nome,type:c.card_data.tipo,cost:c.card_data.custo,
        value:c.card_data.valor,description:c.card_data.desc}))};
      const g=await fetch(endpoint,{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
        body:JSON.stringify({model,temperature:0.25,messages:[
          {role:"system",content:"Return ONLY a JSON object {deckKeys:string[10],name:string,strategy:string,tips:string[3]}. Select only supplied card keys, max 2 copies and never more than owned quantity. Respond in Brazilian Portuguese. No guaranteed wins."},
          {role:"user",content:JSON.stringify(prompt)}]})});
      if(g.ok){const body=await g.json(),raw=body?.choices?.[0]?.message?.content;
        try{const x=typeof raw==="string"?JSON.parse(raw):null;
          if(validDeck(x?.deckKeys,pool)){suggestion=x;source="ai_gateway";}}catch{/* fail closed */}
      }
    }
    const keys=source==="ai_gateway"?(suggestion!.deckKeys as string[]):fallback(pool,style);
    if(!validDeck(keys,pool))return reply(503,{error:"invalid_recommendation"});
    const tips=source==="ai_gateway"&&Array.isArray(suggestion?.tips)
      ?(suggestion.tips as unknown[]).filter((x):x is string=>typeof x==="string").slice(0,3).map(x=>x.slice(0,260))
      :["Use sua energia com propósito.","Guarde defesa para a resposta do rival.","Ajuste a curva de custo antes da ranqueada."];
    return reply(200,{data:{deckKeys:keys,monsterId,playStyle:style,source,
      name:source==="ai_gateway"&&typeof suggestion?.name==="string"?String(suggestion.name).slice(0,70):"Deck tático",
      strategy:source==="ai_gateway"&&typeof suggestion?.strategy==="string"?String(suggestion.strategy).slice(0,1200)
        :"Combine cartas de baixo custo com respostas defensivas e controle de energia.",
      tips,model:source==="ai_gateway"?model:null}});
  }catch(e){console.error("advisor error",e instanceof Error?e.message:"unknown");return reply(503,{error:"advisor_unavailable"});}
});
