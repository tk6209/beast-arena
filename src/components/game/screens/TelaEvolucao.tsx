import React, { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS } from "@/game/data";
import {
  MAX_PL, getUpgradeCost, getStatMultipliers, canUpgrade,
  unlocksPerkAt, PERKS, PERK_UNLOCK_LEVELS, getPerk,
  type PerkSlot, type UserMonster,
} from "@/game/evolution";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import ChromeNoise from "@/components/game/ChromeNoise";
import { toast } from "@/hooks/use-toast";

interface Props {
  user: User;
  monstroId: string;
  onVoltar: () => void;
}

const CSS = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes plPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 18px #b794ff66} 50%{box-shadow:0 0 36px #b794ffaa} }
  @keyframes lvlUp   { 0%{transform:scale(.4) rotate(-12deg);opacity:0} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
`;

export default function TelaEvolucao({ user, monstroId, onVoltar }: Props) {
  const m = MONSTROS[monstroId];
  const [um, setUm] = useState<UserMonster | null>(null);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState(false);
  const [perkPicker, setPerkPicker] = useState<PerkSlot | null>(null);
  const [showLvlUp, setShowLvlUp] = useState(false);

  useEffect(() => { reload(); }, [user.id, monstroId]);

  async function reload() {
    const [{ data: umRow }, { data: prof }] = await Promise.all([
      supabase.from("user_monsters")
        .select("monster_id,power_level,shards,selected_gadget,selected_star_power,selected_hyper,selected_gear")
        .eq("user_id", user.id).eq("monster_id", monstroId).maybeSingle(),
      supabase.from("profiles").select("coins").eq("user_id", user.id).single(),
    ]);
    setCoins(prof?.coins || 0);
    if (umRow) setUm(umRow as any);
    else {
      // Seed if missing (shouldn't happen after backfill, but safe)
      const seed = { monster_id: monstroId, power_level: 1, shards: 0,
        selected_gadget: null, selected_star_power: null, selected_hyper: null, selected_gear: null };
      await supabase.from("user_monsters").insert({ user_id: user.id, ...seed });
      setUm(seed);
    }
  }

  if (!m || !um) {
    return <div style={{ position:"fixed",inset:0,background:"#07061a",display:"flex",alignItems:"center",justifyContent:"center",color:"#b794ff",fontFamily:"Bebas Neue" }}>Carregando…</div>;
  }

  const cost = getUpgradeCost(um.power_level);
  const isMax = um.power_level >= MAX_PL;
  const canUp = !isMax && canUpgrade(um, coins);
  const multNow  = getStatMultipliers(um.power_level);
  const multNext = getStatMultipliers(um.power_level + 1);
  const hpNow  = Math.round(m.hp  * multNow.hp);
  const atkNow = Math.round(m.atk * multNow.atk);
  const hpNext  = Math.round(m.hp  * multNext.hp);
  const atkNext = Math.round(m.atk * multNext.atk);

  async function evoluir() {
    if (busy || !cost || !canUp) return;
    setBusy(true);
    try {
      const newPl = um!.power_level + 1;
      const newShards = um!.shards - cost.shards;
      const newCoins  = coins - cost.coins;
      const { error: e1 } = await supabase.from("user_monsters")
        .update({ power_level: newPl, shards: newShards })
        .eq("user_id", user.id).eq("monster_id", monstroId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("profiles")
        .update({ coins: newCoins }).eq("user_id", user.id);
      if (e2) throw e2;

      setUm({ ...um!, power_level: newPl, shards: newShards });
      setCoins(newCoins);
      setShowLvlUp(true);
      setTimeout(() => setShowLvlUp(false), 1400);

      const slot = unlocksPerkAt(newPl);
      if (slot) {
        setTimeout(() => setPerkPicker(slot), 1000);
      } else {
        toast({ title: `🎉 ${m.nome} subiu para PL ${newPl}!`, description: `HP +${hpNext - hpNow} · Dano +${atkNext - atkNow}` });
      }
    } catch (e: any) {
      toast({ title: "Erro ao evoluir", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function escolherPerk(slot: PerkSlot, perkId: string) {
    const col = `selected_${slot}` as const;
    const { error } = await supabase.from("user_monsters")
      .update({ [col]: perkId })
      .eq("user_id", user.id).eq("monster_id", monstroId);
    if (error) { toast({ title: "Erro", description: error.message, variant:"destructive" }); return; }
    setUm({ ...um!, [col]: perkId } as any);
    setPerkPicker(null);
    const perk = getPerk(slot, perkId)!;
    toast({ title: `${perk.emoji} ${perk.nome} desbloqueado!`, description: perk.desc });
  }

  const shardCost  = cost?.shards ?? 0;
  const coinCost   = cost?.coins  ?? 0;
  const shardPct   = cost ? Math.min(100, (um.shards / shardCost) * 100) : 100;

  return (
    <div style={{ position:"fixed", inset:0,
      background:`radial-gradient(ellipse at 50% 0%, ${m.bg2}33 0%, #0a0820 50%, #050316 100%)`,
      overflowY:"auto", color:"#e8e6ff", fontFamily:"'Barlow', sans-serif",
      paddingTop:"max(env(safe-area-inset-top), 12px)",
      paddingBottom:"max(env(safe-area-inset-bottom), 24px)" }}>
      <style>{CSS}</style>
      <ChromeNoise />

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", gap:12 }}>
        <button onClick={onVoltar} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
          borderRadius:10, color:"#b794ff", padding:"6px 12px", cursor:"pointer", fontFamily:"Bebas Neue", letterSpacing:1.5 }}>← VOLTAR</button>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,213,79,.1)", border:"1px solid #ffd54f44",
          borderRadius:10, padding:"4px 10px" }}>
          <span>💰</span><span style={{ fontFamily:"Bebas Neue", color:"#ffd54f", fontSize:18 }}>{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* MONSTER HERO */}
      <div style={{ textAlign:"center", padding:"4px 16px 20px", position:"relative" }}>
        <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:140, height:140, borderRadius:"50%",
          background:`radial-gradient(circle, ${m.glow}33 0%, transparent 70%)`,
          animation:"glow 3s ease-in-out infinite", margin:"0 auto" }}>
          <MonsterAvatar monstroId={monstroId} size={110} glow={m.glow} />
        </div>
        <div style={{ fontFamily:"Bebas Neue", fontSize:38, letterSpacing:3, marginTop:8, color:"#fff" }}>{m.nome}</div>
        <div style={{ display:"inline-block", marginTop:6,
          background:"linear-gradient(135deg,#7c3aed,#b794ff)", padding:"4px 18px",
          borderRadius:99, fontFamily:"Bebas Neue", fontSize:24, letterSpacing:2,
          animation:"plPulse 2s ease-in-out infinite",
          boxShadow:"0 8px 24px rgba(124,58,237,.5)" }}>
          POWER {um.power_level}{isMax && " · MAX"}
        </div>

        {showLvlUp && (
          <div style={{ position:"absolute", top:60, left:0, right:0, pointerEvents:"none",
            fontFamily:"Bebas Neue", fontSize:80, color:"#ffd54f",
            textShadow:"0 0 40px #ffd54f, 0 0 20px #fff", animation:"lvlUp 1.2s ease forwards", letterSpacing:5 }}>
            +1
          </div>
        )}
      </div>

      {/* STATS */}
      <div style={{ margin:"0 16px", padding:16,
        background:"rgba(20,17,51,.6)", border:"1px solid rgba(183,148,255,.15)", borderRadius:14 }}>
        <div style={{ fontFamily:"Bebas Neue", letterSpacing:2, color:"#b794ff", fontSize:14, marginBottom:10 }}>ATRIBUTOS</div>
        <StatRow label="HP"   icon="❤️" now={hpNow}  next={isMax?undefined:hpNext} />
        <StatRow label="DANO" icon="⚔️" now={atkNow} next={isMax?undefined:atkNext} />
      </div>

      {/* SHARDS PROGRESS */}
      {!isMax && (
        <div style={{ margin:"14px 16px 0", padding:16,
          background:"rgba(20,17,51,.6)", border:"1px solid rgba(56,225,255,.15)", borderRadius:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontFamily:"Bebas Neue", letterSpacing:2, color:"#38e1ff", fontSize:14 }}>FRAGMENTOS</span>
            <span style={{ fontFamily:"Bebas Neue", fontSize:18, color:"#fff" }}>{um.shards} / {shardCost}</span>
          </div>
          <div style={{ height:10, background:"rgba(255,255,255,.06)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${shardPct}%`,
              background:"linear-gradient(90deg, #38e1ff, #b794ff)", transition:"width .4s ease" }} />
          </div>
          <div style={{ marginTop:8, fontSize:12, color:"#8a85b3" }}>
            Ganhe fragmentos jogando batalhas com {m.nome}.
          </div>
        </div>
      )}

      {/* PERKS */}
      <div style={{ margin:"14px 16px 0", padding:16,
        background:"rgba(20,17,51,.6)", border:"1px solid rgba(255,213,79,.15)", borderRadius:14 }}>
        <div style={{ fontFamily:"Bebas Neue", letterSpacing:2, color:"#ffd54f", fontSize:14, marginBottom:10 }}>PODERES ESPECIAIS</div>
        {(Object.keys(PERK_UNLOCK_LEVELS) as PerkSlot[]).map(slot => {
          const unlockedAt = PERK_UNLOCK_LEVELS[slot];
          const isUnlocked = um.power_level >= unlockedAt;
          const col = `selected_${slot}` as const;
          const chosenId = (um as any)[col] as string | null;
          const perk = chosenId ? getPerk(slot, chosenId) : null;
          const slotLabel: Record<PerkSlot, string> = {
            gadget: "GADGET", star_power: "STAR POWER", hyper: "HYPER", gear: "MYTHIC GEAR",
          };
          return (
            <div key={slot}
              onClick={() => isUnlocked && !perk && setPerkPicker(slot)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", marginBottom:6,
                background: isUnlocked ? "rgba(183,148,255,.08)" : "rgba(255,255,255,.02)",
                border: `1px solid ${isUnlocked ? "#b794ff44" : "rgba(255,255,255,.05)"}`,
                borderRadius:10, opacity: isUnlocked ? 1 : 0.45,
                cursor: isUnlocked && !perk ? "pointer" : "default" }}>
              <div style={{ fontSize:24 }}>{perk?.emoji || (isUnlocked ? "❓" : "🔒")}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"Bebas Neue", fontSize:14, letterSpacing:1.5, color:"#b794ff" }}>
                  {slotLabel[slot]} <span style={{ color:"#5a5380", fontSize:11 }}>· PL {unlockedAt}</span>
                </div>
                <div style={{ fontSize:12, color: perk ? "#e8e6ff" : "#8a85b3" }}>
                  {perk ? `${perk.nome} — ${perk.desc}` : (isUnlocked ? "Toque para escolher" : "Bloqueado")}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* UPGRADE BUTTON */}
      {!isMax && (
        <div style={{ padding:"20px 16px 0" }}>
          <button onClick={evoluir} disabled={!canUp || busy} style={{
            width:"100%", minHeight:64, borderRadius:16, border:"none",
            background: canUp
              ? "linear-gradient(135deg, #7c3aed, #b794ff)"
              : "rgba(255,255,255,.05)",
            color: canUp ? "#fff" : "#5a5380",
            fontFamily:"Bebas Neue", fontSize:24, letterSpacing:3,
            cursor: canUp ? "pointer" : "not-allowed",
            boxShadow: canUp ? "0 10px 30px rgba(124,58,237,.5)" : "none",
            transition:"transform .1s" }}>
            EVOLUIR · 💎 {shardCost} · 💰 {coinCost.toLocaleString()}
          </button>
          {!canUp && (
            <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:"#ff8aa0" }}>
              {um.shards < shardCost ? `Faltam ${shardCost - um.shards} fragmentos` : `Faltam ${coinCost - coins} moedas`}
            </div>
          )}
        </div>
      )}
      {isMax && (
        <div style={{ padding:"20px 16px 0", textAlign:"center",
          fontFamily:"Bebas Neue", fontSize:22, color:"#ffd54f", letterSpacing:3,
          textShadow:"0 0 18px #ffd54f88" }}>
          ★ PODER MÁXIMO ATINGIDO ★
        </div>
      )}

      {/* PERK PICKER MODAL */}
      {perkPicker && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.85)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
          animation:"fadeUp .3s" }}>
          <div style={{ background:"linear-gradient(160deg,#141133,#1f1a52)",
            border:"1px solid #b794ff55", borderRadius:18, padding:22, maxWidth:420, width:"100%" }}>
            <div style={{ fontFamily:"Bebas Neue", fontSize:14, color:"#b794ff", letterSpacing:2, textAlign:"center" }}>
              ESCOLHA UM PODER
            </div>
            <div style={{ fontFamily:"Bebas Neue", fontSize:28, color:"#fff", letterSpacing:2, textAlign:"center", marginBottom:14 }}>
              {perkPicker === "gadget" && "GADGET"}
              {perkPicker === "star_power" && "STAR POWER"}
              {perkPicker === "hyper" && "HYPER"}
              {perkPicker === "gear" && "MYTHIC GEAR"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {PERKS[perkPicker].map(p => (
                <button key={p.id} onClick={() => escolherPerk(perkPicker, p.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:14,
                    background:"rgba(255,255,255,.04)", border:"1px solid #b794ff33", borderRadius:12,
                    cursor:"pointer", textAlign:"left", color:"#e8e6ff" }}>
                  <div style={{ fontSize:32 }}>{p.emoji}</div>
                  <div>
                    <div style={{ fontFamily:"Bebas Neue", fontSize:20, color:"#b794ff", letterSpacing:1.5 }}>{p.nome}</div>
                    <div style={{ fontSize:12, color:"#a8a6cf" }}>{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop:14, textAlign:"center", fontSize:11, color:"#5a5380" }}>
              ⚠️ A escolha é permanente nesta versão
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, icon, now, next }:
  { label:string; icon:string; now:number; next?:number }) {
  const delta = next != null ? next - now : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"6px 0" }}>
      <span style={{ fontSize:20, width:28 }}>{icon}</span>
      <span style={{ flex:1, fontFamily:"Bebas Neue", letterSpacing:1.5, color:"#a8a6cf" }}>{label}</span>
      <span style={{ fontFamily:"Bebas Neue", fontSize:22, color:"#fff" }}>{now}</span>
      {next != null && delta > 0 && (
        <>
          <span style={{ margin:"0 8px", color:"#5a5380" }}>›</span>
          <span style={{ fontFamily:"Bebas Neue", fontSize:22, color:"#69f0ae" }}>{next}</span>
          <span style={{ marginLeft:6, fontSize:12, color:"#69f0ae" }}>+{delta}</span>
        </>
      )}
    </div>
  );
}