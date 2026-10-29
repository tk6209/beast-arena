import React, { useEffect, useState } from "react";
import { supabase, SUPABASE_PUBLIC_URL } from "@/integrations/supabase/client";
import { pageBg, DS } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import Carta from "@/components/game/Carta";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import { MONSTROS } from "@/game/data";
import { loadPlayerDeck, savePlayerDeck } from "@/game/serverApi";
import type { User } from "@supabase/supabase-js";
import type { CartaData } from "@/game/data";

interface Props { user: User; onVoltar: () => void; }

const DECK_SIZE = 10;

type PlayStyle = 'aggro' | 'control' | 'defensive' | 'combo';
interface DeckAdvice { deckKeys: string[]; name: string; strategy: string; tips: string[]; source: 'ai_gateway'|'deterministic_fallback'; }

interface OwnedCard { card_key: string; card_data: CartaData; quantity: number; raridade: string; }

export default function TelaDeckBuilder({ user, onVoltar }: Props) {
  const monsterIds = Object.keys(MONSTROS);
  const [selMonster, setSelMonster] = useState<string>(monsterIds[0]);
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [deck, setDeck] = useState<CartaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [playStyle,setPlayStyle] = useState<PlayStyle>('aggro');
  const [advisorBusy,setAdvisorBusy] = useState(false);
  const [advice,setAdvice] = useState<DeckAdvice|null>(null);
  const [preferredCardKeys,setPreferredCardKeys] = useState<string[]>([]);
  const [advisorError,setAdvisorError] = useState<string|null>(null);

  // Load owned cards once
  useEffect(() => { (async () => {
    const { data } = await supabase.from("user_cards")
      .select("card_key,card_data,quantity,raridade")
      .eq("user_id", user.id);
    setOwned((data as any) || []);
  })(); }, [user.id]);

  // Load deck for selected monster
  useEffect(() => { (async () => {
    setLoading(true);
    const d = await loadPlayerDeck(user.id, selMonster);
    setDeck(d || []);
    setLoading(false);
  })(); }, [user.id, selMonster]);

  function toggleCard(c: CartaData) {
    const key = (x: CartaData) => x.nome + ':' + x.tipo;
    const ownedCard = owned.find(item => key(item.card_data)===key(c));
    if (!ownedCard) { setToast('Carta não possuída'); return; }
    const already = deck.filter(item=>key(item)===key(c)).length;
    const allowed = Math.min(2,ownedCard.quantity);
    if (already >= allowed) { setToast('Limite de cópias desta carta'); return; }
    if (deck.length >= DECK_SIZE) { setToast('Máximo 10 cartas'); return; }
    setDeck([...deck, {...ownedCard.card_data,id:deck.length+1}]);
  }

  async function recommendDeck() {
    setAdvisorBusy(true); setAdvisorError(null); setAdvice(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Faça login para receber recomendações.');
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PUBLIC_URL;
      const res=await fetch(baseUrl+'/functions/v1/ai-deck-advisor',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({monsterId:selMonster,playStyle,
          preferredCardKeys:preferredCardKeys.length?preferredCardKeys:undefined})
      });
      const body=await res.json();
      if (!res.ok) throw new Error(body.message || body.error || 'Coach indisponível.');
      const suggestion: DeckAdvice=body.data;
      if (!suggestion || !Array.isArray(suggestion.deckKeys) || suggestion.deckKeys.length!==DECK_SIZE)
        throw new Error('Resposta inválida do recomendador.');
      const counts=new Map<string,number>();
      for(const key of suggestion.deckKeys){
        const item=owned.find(row=>row.card_key===key);
        if(!item)throw new Error('O recomendador usou uma carta não possuída.');
        const count=(counts.get(key)||0)+1;
        if(count>Math.min(2,item.quantity))throw new Error('O recomendador excedeu a quantidade possuída.');
        counts.set(key,count);
      }
      setAdvice(suggestion);
    }catch(e){setAdvisorError(e instanceof Error?e.message:'Coach indisponível.');}
    finally{setAdvisorBusy(false);}
  }
  function applyAdvice(){
    if(!advice)return;
    const next=advice.deckKeys.map((key,index)=>{
      const card=owned.find(item=>item.card_key===key);
      if(!card)throw new Error('Coleção alterada; atualize a sugestão.');
      return {...card.card_data,id:index+1};
    });
    if(next.length!==DECK_SIZE)return;
    setDeck(next);setToast('Deck aplicado. Revise e clique em SALVAR.');
  }

  async function handleSave() {
    if (deck.length !== DECK_SIZE) { setToast("Monte um deck completo de 10 cartas"); setTimeout(() => setToast(null), 1500); return; }
    setSaving(true);
    try {
      await savePlayerDeck(user.id, selMonster, deck);
      setToast("✅ Deck salvo!");
      setTimeout(() => setToast(null), 1500);
    } catch (e) { setToast("Erro ao salvar"); setTimeout(() => setToast(null), 1800); }
    setSaving(false);
  }

  const mInfo = MONSTROS[selMonster];

  return (
    <div style={pageBg("#0a1430")}>
      <ChromeNoise />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ padding: "16px 12px 24px", maxWidth: 480, margin: "0 auto", animation: "fadeUp .4s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: DS.fontDisplay, fontSize: 28, color: DS.cyan, letterSpacing: 3 }}>⚔️ DECK BUILDER</div>
        </div>

        {/* Monster selector */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
          {monsterIds.map(id => {
            const active = selMonster === id;
            return (
              <button key={id} onClick={() => setSelMonster(id)} style={{
                flexShrink: 0, width: 56, height: 56, borderRadius: 12,
                background: active ? `${DS.cyan}22` : "rgba(255,255,255,.03)",
                border: `2px solid ${active ? DS.cyan : DS.bg3}`,
                cursor: "pointer", padding: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MonsterAvatar monstroId={id} size={44} />
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: DS.fontUI, fontSize: 11, color: "#8a95aa", textAlign: "center", marginBottom: 10 }}>
          DECK DE <span style={{ color: DS.gold }}>{mInfo?.nome?.toUpperCase()}</span> · {deck.length}/{DECK_SIZE}
        </div>

        {/* Current deck */}
        <div style={{
          background: "rgba(0,212,255,.04)", border: `1px solid ${DS.cyan}44`,
          borderRadius: 14, padding: 10, marginBottom: 14, minHeight: 140,
        }}>
          <div style={{ fontFamily: DS.fontUI, fontSize: 10, color: DS.cyan, letterSpacing: 2, marginBottom: 6 }}>DECK ATIVO</div>
          {deck.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 11, padding: 20 }}>
              Toque nas cartas abaixo para adicionar
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, justifyItems: "center" }}>
              {deck.map((c,i) => (
                <div key={i} onClick={() => setDeck(prev => prev.filter((_,j)=>j!==i))} style={{ cursor: "pointer" }}>
                  <Carta carta={c} mini sel />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Owned pool */}
        <div style={{ fontFamily: DS.fontUI, fontSize: 10, color: "#8a95aa", letterSpacing: 2, marginBottom: 6 }}>
          MINHAS CARTAS · {owned.length}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", color: "#8a95aa", padding: 30, fontSize: 12 }}>Carregando…</div>
        ) : owned.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#8a95aa", fontSize: 12 }}>
            Você ainda não tem cartas. Vença batalhas para coletar!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, justifyItems: "center", marginBottom: 14 }}>
            {owned.map(oc => {
              const inDeck = !!deck.find(d => d.id === oc.card_data.id);
              return (
                <div key={oc.card_key} onClick={() => toggleCard(oc.card_data)}
                     style={{ cursor: "pointer", opacity: inDeck ? 0.35 : 1, position: "relative" }}>
                  <Carta carta={oc.card_data} mini sel={inDeck} />
                  {oc.quantity > 1 && (
                    <div style={{
                      position: "absolute", top: -4, right: -4, background: DS.gold, color: "#000",
                      fontFamily: DS.fontDisplay, fontSize: 10, padding: "1px 6px", borderRadius: 10,
                    }}>×{oc.quantity}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <section aria-label="Coach tático de baralhos" style={{
          background:'rgba(0,229,255,.055)',border:'1px solid rgba(0,229,255,.35)',
          borderRadius:14,padding:14,marginBottom:16}}>
          <h2 style={{color:DS.cyan,fontFamily:DS.fontDisplay,fontSize:20,marginBottom:8}}>COACH TÁTICO · AI</h2>
          <p style={{color:'#aab5c5',fontSize:12,marginBottom:10}}>
            Escolha seu estilo. O coach usa somente cartas possuídas e disponíveis na sua coleção.
          </p>
          <label style={{display:'block',color:'#fff',fontSize:12,marginBottom:6}} htmlFor="style-deck">Estilo de jogo</label>
          <select id="style-deck" value={playStyle} onChange={e=>setPlayStyle(e.target.value as PlayStyle)}
            style={{width:'100%',padding:'10px',background:'#18213a',color:'#fff',border:'1px solid #42516c',
              borderRadius:8,fontSize:14,marginBottom:12}}>
            <option value="aggro">Agressivo</option><option value="control">Controle</option>
            <option value="defensive">Defensivo</option><option value="combo">Combo</option>
          </select>
          <div style={{color:'#aab5c5',fontSize:11,marginBottom:8}}>Cartas favoritas para considerar (opcional)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {owned.map(item=>(
              <label key={item.card_key} style={{display:'flex',gap:4,alignItems:'center',borderRadius:6,
                background:'#18213a',color:'#e1e8f3',padding:'6px',fontSize:11}}>
                <input type="checkbox" checked={preferredCardKeys.includes(item.card_key)}
                  onChange={e=>setPreferredCardKeys(prev=>e.target.checked?
                    [...prev,item.card_key]:prev.filter(key=>key!==item.card_key))}/>
                {item.card_data.nome} ×{item.quantity}
              </label>
            ))}
          </div>
          <button type="button" disabled={advisorBusy || owned.length===0} onClick={recommendDeck}
            style={{width:'100%',minHeight:44,borderRadius:9,border:0,background:DS.cyan,
              fontWeight:900,color:'#041322',cursor:'pointer'}}>
            {advisorBusy?'ANALISANDO...':'RECOMENDAR DECK E ESTRATÉGIA'}
          </button>
          {advisorError&&<p role="alert" style={{color:'#ff9c9c',fontSize:12,marginTop:10}}>{advisorError}</p>}
          {advice&&(
            <div style={{paddingTop:12}}>
              <strong style={{color:'#fff'}}>{advice.name}</strong>
              <p style={{color:'#ccd8e8',fontSize:12,marginTop:6}}>{advice.strategy}</p>
              <ol style={{color:'#ccd8e8',fontSize:12,paddingLeft:20,margin:'8px 0'}}>
                {advice.tips.map((tip,i)=><li key={i}>{tip}</li>)}
              </ol>
              <p style={{color:'#94a3b8',fontSize:10}}>
                {advice.source==='ai_gateway'?'Sugestão do modelo via AI Gateway':'Sugestão determinística — modelo não disponível ou inválido'}
              </p>
              <button type="button" onClick={applyAdvice}
                style={{width:'100%',minHeight:44,borderRadius:8,border:'1px solid #78fac5',
                  color:'#78fac5',background:'transparent',fontWeight:800}}>APLICAR DECK</button>
            </div>
          )}
        </section>
        <div style={{ display: "grid", gap: 8 }}>
          <BtnMain variant="gold" onClick={handleSave} disabled={saving}>
            {saving ? "SALVANDO…" : "💾 SALVAR DECK"}
          </BtnMain>
          <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
        </div>

        {toast && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: DS.bg1, border: `1px solid ${DS.gold}`, color: DS.gold,
            padding: "10px 18px", borderRadius: 12, fontFamily: DS.fontUI, fontSize: 13,
            boxShadow: DS.shadowGold, zIndex: 999,
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
}