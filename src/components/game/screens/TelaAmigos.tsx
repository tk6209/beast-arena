import React, { useEffect, useState, useRef } from "react";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  onVoltar: () => void;
  onConvidar?: (friendUserId: string) => void;
}

interface FriendProfile {
  user_id: string;
  display_name: string;
  public_id: string;
  level: number;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: FriendProfile;
  receiver_profile?: FriendProfile;
}

interface Friendship {
  id: string;
  user_a: string;
  user_b: string;
  friend_profile?: FriendProfile;
}

export default function TelaAmigos({ user, onVoltar, onConvidar }: Props) {
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadFriends();
    loadRequests();

    // Realtime for friend requests
    const channel = supabase
      .channel("friend-requests-" + user.id)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "friend_requests",
      }, () => { loadRequests(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  async function loadFriends() {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (!data) return;

    // Load friend profiles
    const friendIds = data.map(f => f.user_a === user.id ? f.user_b : f.user_a);
    if (friendIds.length === 0) { setFriends([]); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, public_id, level")
      .in("user_id", friendIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setFriends(data.map(f => ({
      ...f,
      friend_profile: profileMap.get(f.user_a === user.id ? f.user_b : f.user_a) as FriendProfile | undefined,
    })));
  }

  async function loadRequests() {
    const { data } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("status", "pending")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!data) return;

    const userIds = [...new Set(data.flatMap(r => [r.sender_id, r.receiver_id]))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, public_id, level")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setRequests(data.map(r => ({
      ...r,
      sender_profile: profileMap.get(r.sender_id) as FriendProfile | undefined,
      receiver_profile: profileMap.get(r.receiver_id) as FriendProfile | undefined,
    })));
  }

  async function searchPlayers() {
    if (searchQuery.length < 2) return;
    setLoading(true);
    const q = searchQuery.trim();

    // Search by public_id or display_name
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, public_id, level")
      .or(`public_id.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("user_id", user.id)
      .limit(10);

    setSearchResults((data || []) as FriendProfile[]);
    setLoading(false);
  }

  async function sendRequest(targetId: string) {
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: targetId,
    });
    if (error) {
      if (error.message.includes("duplicate")) setMsg("Solicitação já enviada.");
      else setMsg("Erro ao enviar solicitação.");
    } else {
      setMsg("Solicitação enviada! ✅");
      loadRequests();
    }
    setTimeout(() => setMsg(""), 3000);
  }

  async function acceptRequest(requestId: string, senderId: string) {
    // Update request status
    await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);

    // Create friendship (canonical order)
    const [a, b] = [user.id, senderId].sort();
    await supabase.from("friendships").insert({ user_a: a, user_b: b });

    loadRequests();
    loadFriends();
    setMsg("Amizade aceita! 🤝");
    setTimeout(() => setMsg(""), 3000);
  }

  async function rejectRequest(requestId: string) {
    await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);
    loadRequests();
  }

  async function removeFriend(friendshipId: string) {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    loadFriends();
    setMsg("Amigo removido.");
    setTimeout(() => setMsg(""), 3000);
  }

  const incomingRequests = requests.filter(r => r.receiver_id === user.id);
  const outgoingRequests = requests.filter(r => r.sender_id === user.id);

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        padding: 16, position: "relative", zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 16, animation: "fadeUp .4s ease" }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: 24, color: "#00e5ff", letterSpacing: 3 }}>
            👥 AMIGOS
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {[
            { key: "friends" as const, label: "Amigos", count: friends.length },
            { key: "requests" as const, label: "Pedidos", count: incomingRequests.length },
            { key: "search" as const, label: "Buscar" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 8,
              background: tab === t.key ? "rgba(0,229,255,.15)" : "rgba(255,255,255,.04)",
              border: `1px solid ${tab === t.key ? "rgba(0,229,255,.3)" : "rgba(255,255,255,.08)"}`,
              color: tab === t.key ? "#00e5ff" : "#8a95aa",
              fontFamily: "Bangers, cursive", fontSize: 12, letterSpacing: 1,
              cursor: "pointer",
            }}>
              {t.label}{t.count ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.2)",
            borderRadius: 8, padding: "8px 12px", marginBottom: 8,
            fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#69f0ae", textAlign: "center",
          }}>
            {msg}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {tab === "friends" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {friends.length === 0 && (
                <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 13, fontFamily: "Nunito, sans-serif", padding: 30 }}>
                  Nenhum amigo ainda. Use a aba Buscar para encontrar jogadores!
                </div>
              )}
              {friends.map(f => (
                <div key={f.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 10, padding: "10px 12px",
                }}>
                  <div>
                    <div style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#e8f0ff" }}>
                      {f.friend_profile?.display_name || "Jogador"}
                    </div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                      {f.friend_profile?.public_id} • LV {f.friend_profile?.level || 1}
                    </div>
                  </div>
                  <button onClick={() => removeFriend(f.id)} style={{
                    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                    color: "#ef4444", fontSize: 10, fontFamily: "Nunito, sans-serif",
                  }}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "requests" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {incomingRequests.length > 0 && (
                <>
                  <div style={{ fontFamily: "Bangers, cursive", fontSize: 12, color: "#ffd54f", letterSpacing: 1, marginBottom: 4 }}>
                    📩 RECEBIDOS
                  </div>
                  {incomingRequests.map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,213,79,.04)", border: "1px solid rgba(255,213,79,.15)",
                      borderRadius: 10, padding: "10px 12px",
                    }}>
                      <div>
                        <div style={{ fontFamily: "Bangers, cursive", fontSize: 13, color: "#e8f0ff" }}>
                          {r.sender_profile?.display_name || "Jogador"}
                        </div>
                        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                          {r.sender_profile?.public_id}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => acceptRequest(r.id, r.sender_id)} style={{
                          background: "rgba(105,240,174,.15)", border: "1px solid rgba(105,240,174,.3)",
                          borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                          color: "#69f0ae", fontSize: 10, fontFamily: "Nunito, sans-serif",
                        }}>✓</button>
                        <button onClick={() => rejectRequest(r.id)} style={{
                          background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
                          borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                          color: "#ef4444", fontSize: 10, fontFamily: "Nunito, sans-serif",
                        }}>✗</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {outgoingRequests.length > 0 && (
                <>
                  <div style={{ fontFamily: "Bangers, cursive", fontSize: 12, color: "#8a95aa", letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>
                    📤 ENVIADOS
                  </div>
                  {outgoingRequests.map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                      borderRadius: 10, padding: "10px 12px",
                    }}>
                      <div>
                        <div style={{ fontFamily: "Bangers, cursive", fontSize: 13, color: "#e8f0ff" }}>
                          {r.receiver_profile?.display_name || "Jogador"}
                        </div>
                        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                          Pendente...
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 13, fontFamily: "Nunito, sans-serif", padding: 30 }}>
                  Nenhuma solicitação pendente.
                </div>
              )}
            </div>
          )}

          {tab === "search" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchPlayers()}
                  placeholder="Nome ou beast-id..."
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                    color: "#e8f0ff", fontSize: 13, fontFamily: "Nunito, sans-serif",
                    outline: "none",
                  }}
                />
                <BtnMain variant="blue" onClick={searchPlayers} disabled={loading}>
                  🔍
                </BtnMain>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {searchResults.map(p => (
                  <div key={p.user_id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 10, padding: "10px 12px",
                  }}>
                    <div>
                      <div style={{ fontFamily: "Bangers, cursive", fontSize: 13, color: "#e8f0ff" }}>
                        {p.display_name}
                      </div>
                      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                        {p.public_id} • LV {p.level}
                      </div>
                    </div>
                    <button onClick={() => sendRequest(p.user_id)} style={{
                      background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.2)",
                      borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                      color: "#00e5ff", fontSize: 10, fontFamily: "Nunito, sans-serif",
                    }}>
                      + Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ paddingTop: 12 }}>
          <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
        </div>
      </div>
    </div>
  );
}
