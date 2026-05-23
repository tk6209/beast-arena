import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import BtnMain from "@/components/game/BtnMain";

interface Props {
  userId: string;
  onAccept: (sessionId: string) => void;
}

interface Invite {
  id: string;
  inviter_id: string;
  session_id: string | null;
  status: string;
  expires_at: string;
  inviter_name?: string;
}

export default function GameInviteNotification({ userId, onAccept }: Props) {
  const [invite, setInvite] = useState<Invite | null>(null);

  useEffect(() => {
    // Check for pending invites
    checkInvites();

    const channel = supabase
      .channel("game-invites-" + userId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "game_invites",
        filter: `invitee_id=eq.${userId}`,
      }, () => { checkInvites(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function checkInvites() {
    const { data } = await supabase
      .from("game_invites")
      .select("*")
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const inv = data[0];
      // Check if expired
      if (new Date(inv.expires_at) < new Date()) {
        return;
      }
      // Get inviter name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", inv.inviter_id)
        .single();

      setInvite({
        ...inv,
        inviter_name: profile?.display_name || "Jogador",
      });
    }
  }

  async function accept() {
    if (!invite) return;
    await supabase.from("game_invites").update({ status: "accepted" }).eq("id", invite.id);
    if (invite.session_id) {
      onAccept(invite.session_id);
    }
    setInvite(null);
  }

  async function decline() {
    if (!invite) return;
    await supabase.from("game_invites").update({ status: "declined" }).eq("id", invite.id);
    setInvite(null);
  }

  if (!invite) return null;

  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9000, width: "calc(100% - 32px)", maxWidth: 320,
      background: "linear-gradient(180deg, rgba(15,25,45,.97), rgba(5,10,25,.99))",
      border: "1px solid rgba(0,229,255,.3)",
      borderRadius: 14, padding: 16,
      boxShadow: "0 12px 40px rgba(0,0,0,.5), 0 0 30px rgba(0,229,255,.1)",
      animation: "fadeUp .4s ease",
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <div style={{
        fontFamily: "Bangers, cursive", fontSize: 14, color: "#ffd54f",
        letterSpacing: 2, textAlign: "center", marginBottom: 6,
      }}>
        ⚔️ CONVITE PARA JOGAR
      </div>
      <div style={{
        fontFamily: "Nunito, sans-serif", fontSize: 13, color: "#94a3b8",
        textAlign: "center", marginBottom: 12,
      }}>
        <strong style={{ color: "#e8f0ff" }}>{invite.inviter_name}</strong> te convidou para uma batalha!
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <BtnMain variant="gold" onClick={accept} style={{ flex: 1 }}>ACEITAR</BtnMain>
        <BtnMain variant="dark" onClick={decline} style={{ flex: 1 }}>RECUSAR</BtnMain>
      </div>
    </div>
  );
}
