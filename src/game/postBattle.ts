import { supabase } from "@/integrations/supabase/client";
import type { BattleStats } from "@/components/game/screens/TelaBatalha";
import { getActiveXpBoost, consumeXpBoost } from "@/game/xpBoost";

/* ─────────────────────────────────────────────
   POST-BATTLE PROGRESSION
   Called after every battle to update:
   - Daily mission progress
   - Achievement unlocks
───────────────────────────────────────────── */

export interface BattleHistoryEntry {
  sessionId?: string | null;
  won: boolean;
  monsterUsed: string;
  opponentMonster?: string;
  damageDealt: number;
  cardsPlayed: number;
  turns?: number;
  mode?: string;
  dificuldade?: string;
}

export async function postBattleProgression(
  userId: string,
  ganhou: boolean,
  stats: BattleStats,
  monstroId: string,
  historyEntry?: BattleHistoryEntry
) {
  try {
    await Promise.all([
      updateMissions(userId, ganhou, stats),
      checkAchievements(userId, ganhou, stats, monstroId),
      updateSeasonPass(userId, ganhou, stats),
      saveBattleHistory(userId, ganhou, stats, monstroId, historyEntry),
    ]);
  } catch (err) {
    console.error("postBattleProgression error:", err);
  }
}

/* ── Battle History ── */
async function saveBattleHistory(
  userId: string,
  ganhou: boolean,
  stats: BattleStats,
  monstroId: string,
  entry?: BattleHistoryEntry
) {
  await supabase.from("battle_history").insert({
    user_id: userId,
    session_id: entry?.sessionId || null,
    won: ganhou,
    monster_used: entry?.monsterUsed || monstroId,
    opponent_monster: entry?.opponentMonster || null,
    damage_dealt: stats.damageDealt || 0,
    cards_played: stats.cardsPlayed || 0,
    turns: entry?.turns || 0,
    mode: entry?.mode || "ai",
    dificuldade: entry?.dificuldade || "medio",
  });
}

/* ── Season Pass XP ── */
async function updateSeasonPass(userId: string, ganhou: boolean, stats: BattleStats) {
  let xpGain = ganhou
    ? 20 + Math.floor(stats.damageDealt / 10) + stats.evolutions * 5
    : 5;

  // Apply active XP Boost multiplier and consume one charge
  const boost = await getActiveXpBoost(userId);
  if (boost.active && boost.multiplier > 1) {
    xpGain = Math.round(xpGain * boost.multiplier);
    await consumeXpBoost(userId);
  }

  const { data } = await supabase
    .from("season_pass")
    .select("xp, tier")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // First time — create record
    await supabase.from("season_pass").insert({
      user_id: userId,
      xp: xpGain,
      tier: 0,
      season: 1,
      claimed_tiers: [],
    });
    return;
  }

  const newXp = (data.xp || 0) + xpGain;
  // Tier thresholds matching SEASON_TIERS in TelaSeasonPass
  const TIERS = [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
  const newTier = TIERS.filter(t => newXp >= t).length;

  await supabase
    .from("season_pass")
    .update({ xp: newXp, tier: newTier })
    .eq("user_id", userId);
}

/* ── Mission Progress ── */
async function updateMissions(userId: string, ganhou: boolean, stats: BattleStats) {
  const today = new Date().toISOString().split("T")[0];

  const { data: userMissions } = await supabase
    .from("user_missions")
    .select("id, mission_id, progress, completed")
    .eq("user_id", userId)
    .eq("assigned_date", today)
    .eq("completed", false);

  if (!userMissions || userMissions.length === 0) return;

  const missionIds = userMissions.map((um) => um.mission_id);
  const { data: defs } = await supabase
    .from("daily_missions")
    .select("id, mission_type, target_value")
    .in("id", missionIds);

  if (!defs) return;

  for (const um of userMissions) {
    const def = defs.find((d) => d.id === um.mission_id);
    if (!def) continue;

    let delta = 0;
    switch (def.mission_type) {
      case "play_battles":       delta = 1; break;
      case "win_battles":        delta = ganhou ? 1 : 0; break;
      case "play_cards":         delta = stats.cardsPlayed; break;
      case "use_heals":          delta = stats.healsUsed; break;
      case "evolve":             delta = stats.evolutions; break;
      case "deal_damage":        delta = stats.damageDealt; break;
      case "use_defense":        delta = stats.defenseCards; break;
      default:                   delta = 0;
    }

    if (delta <= 0) continue;

    const newProgress = Math.min(def.target_value, (um.progress || 0) + delta);
    const completed = newProgress >= def.target_value;

    await supabase
      .from("user_missions")
      .update({ progress: newProgress, completed })
      .eq("id", um.id);
  }
}

/* ── Achievement Unlocks ── */
async function checkAchievements(
  userId: string,
  ganhou: boolean,
  _stats: BattleStats,
  _monstroId: string
) {
  // Fetch all achievements and which ones the user already has
  const [{ data: allAchs }, { data: mine }, { data: userStats }] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabase.from("user_stats").select("total_wins, win_streak, best_streak").eq("user_id", userId).single(),
  ]);

  if (!allAchs || !userStats) return;

  const unlocked = new Set((mine || []).map((m: any) => m.achievement_id));
  const toUnlock: string[] = [];

  for (const ach of allAchs) {
    if (unlocked.has(ach.id)) continue;

    let earned = false;
    switch (ach.requirement_type) {
      case "total_wins":
        earned = (userStats.total_wins || 0) >= ach.requirement_value;
        break;
      case "win_streak":
        earned = (userStats.win_streak || 0) >= ach.requirement_value;
        break;
      case "win_battle":
        earned = ganhou;
        break;
      default:
        break;
    }

    if (earned) toUnlock.push(ach.id);
  }

  if (toUnlock.length === 0) return;

  const inserts = toUnlock.map((achievement_id) => ({
    user_id: userId,
    achievement_id,
    unlocked_at: new Date().toISOString(),
  }));

  await supabase.from("user_achievements").upsert(inserts, { onConflict: "user_id,achievement_id" });
}
