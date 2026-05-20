export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          emoji: string
          id: string
          rarity: string
          requirement_type: string
          requirement_value: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          rarity?: string
          requirement_type: string
          requirement_value?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          title?: string
        }
        Relationships: []
      }
      battle_history: {
        Row: {
          cards_played: number
          created_at: string
          damage_dealt: number
          dificuldade: string
          id: string
          mode: string
          monster_used: string
          opponent_monster: string | null
          session_id: string | null
          turns: number
          user_id: string
          won: boolean
        }
        Insert: {
          cards_played?: number
          created_at?: string
          damage_dealt?: number
          dificuldade?: string
          id?: string
          mode?: string
          monster_used?: string
          opponent_monster?: string | null
          session_id?: string | null
          turns?: number
          user_id: string
          won?: boolean
        }
        Update: {
          cards_played?: number
          created_at?: string
          damage_dealt?: number
          dificuldade?: string
          id?: string
          mode?: string
          monster_used?: string
          opponent_monster?: string | null
          session_id?: string | null
          turns?: number
          user_id?: string
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "battle_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_missions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          emoji: string
          id: string
          mission_type: string
          reward_coins: number
          reward_xp: number
          target_value: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          mission_type: string
          reward_coins?: number
          reward_xp?: number
          target_value?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          mission_type?: string
          reward_coins?: number
          reward_xp?: number
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string
          id: string
          last_claim_date: string
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_claim_date?: string
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_claim_date?: string
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      game_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload_json: Json | null
          player_slot: number
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload_json?: Json | null
          player_slot: number
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload_json?: Json | null
          player_slot?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invitee_id: string
          inviter_id: string
          session_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          session_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          session_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invites_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          created_at: string
          hp: number
          id: string
          max_hp: number
          monster_id: string
          nickname: string
          session_id: string
          slot: number
          state_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hp?: number
          id?: string
          max_hp?: number
          monster_id: string
          nickname?: string
          session_id: string
          slot: number
          state_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hp?: number
          id?: string
          max_hp?: number
          monster_id?: string
          nickname?: string
          session_id?: string
          slot?: number
          state_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          current_turn: number | null
          id: string
          join_code: string
          state_json: Json | null
          status: Database["public"]["Enums"]["game_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_turn?: number | null
          id?: string
          join_code: string
          state_json?: Json | null
          status?: Database["public"]["Enums"]["game_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_turn?: number | null
          id?: string
          join_code?: string
          state_json?: Json | null
          status?: Database["public"]["Enums"]["game_status"]
          updated_at?: string
        }
        Relationships: []
      }
      matchmaking_queue: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          league: string
          matched_session_id: string | null
          monster_id: string
          player_name: string
          rating: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          league?: string
          matched_session_id?: string | null
          monster_id: string
          player_name?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          league?: string
          matched_session_id?: string | null
          monster_id?: string
          player_name?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_matched_session_id_fkey"
            columns: ["matched_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_decks: {
        Row: {
          cards: Json
          created_at: string
          id: string
          is_active: boolean
          monster_id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cards?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          monster_id: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cards?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          monster_id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_leagues: {
        Row: {
          created_at: string
          id: string
          league: string
          rating: number
          season: number
          season_losses: number
          season_wins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league?: string
          rating?: number
          season?: number
          season_losses?: number
          season_wins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league?: string
          rating?: number
          season?: number
          season_losses?: number
          season_wins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          display_name: string
          display_name_normalized: string | null
          id: string
          level: number
          name_changed_at: string | null
          public_id: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          display_name_normalized?: string | null
          id?: string
          level?: number
          name_changed_at?: string | null
          public_id?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          display_name_normalized?: string | null
          id?: string
          level?: number
          name_changed_at?: string | null
          public_id?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      rankings: {
        Row: {
          created_at: string
          id: string
          losses: number
          player_name: string
          updated_at: string
          user_id: string | null
          wins: number
        }
        Insert: {
          created_at?: string
          id?: string
          losses?: number
          player_name?: string
          updated_at?: string
          user_id?: string | null
          wins?: number
        }
        Update: {
          created_at?: string
          id?: string
          losses?: number
          player_name?: string
          updated_at?: string
          user_id?: string | null
          wins?: number
        }
        Relationships: []
      }
      season_pass: {
        Row: {
          claimed_tiers: number[]
          created_at: string
          id: string
          premium: boolean
          season: number
          tier: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          claimed_tiers?: number[]
          created_at?: string
          id?: string
          premium?: boolean
          season?: number
          tier?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          claimed_tiers?: number[]
          created_at?: string
          id?: string
          premium?: boolean
          season?: number
          tier?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          active: boolean
          created_at: string
          description: string
          emoji: string
          id: string
          item_key: string
          item_type: string
          level_required: number
          name: string
          price_coins: number
          rarity: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          item_key: string
          item_type: string
          level_required?: number
          name: string
          price_coins?: number
          rarity?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          item_key?: string
          item_type?: string
          level_required?: number
          name?: string
          price_coins?: number
          rarity?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          card_data: Json
          card_key: string
          id: string
          obtained_at: string
          quantity: number
          raridade: string
          user_id: string
        }
        Insert: {
          card_data: Json
          card_key: string
          id?: string
          obtained_at?: string
          quantity?: number
          raridade?: string
          user_id: string
        }
        Update: {
          card_data?: Json
          card_key?: string
          id?: string
          obtained_at?: string
          quantity?: number
          raridade?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_key: string
          item_type: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_key: string
          item_type: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_key?: string
          item_type?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          assigned_date: string
          claimed: boolean
          completed: boolean
          created_at: string
          id: string
          mission_id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_date?: string
          claimed?: boolean
          completed?: boolean
          created_at?: string
          id?: string
          mission_id: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_date?: string
          claimed?: boolean
          completed?: boolean
          created_at?: string
          id?: string
          mission_id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          music_enabled: boolean
          opponent_chat_muted: boolean
          sfx_enabled: boolean
          tutorial_completed: boolean
          updated_at: string
          user_id: string
          voice_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          music_enabled?: boolean
          opponent_chat_muted?: boolean
          sfx_enabled?: boolean
          tutorial_completed?: boolean
          updated_at?: string
          user_id: string
          voice_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          music_enabled?: boolean
          opponent_chat_muted?: boolean
          sfx_enabled?: boolean
          tutorial_completed?: boolean
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          best_streak: number
          created_at: string
          favorite_monster: string | null
          id: string
          total_losses: number
          total_wins: number
          updated_at: string
          user_id: string
          win_streak: number
        }
        Insert: {
          best_streak?: number
          created_at?: string
          favorite_monster?: string | null
          id?: string
          total_losses?: number
          total_wins?: number
          updated_at?: string
          user_id: string
          win_streak?: number
        }
        Update: {
          best_streak?: number
          created_at?: string
          favorite_monster?: string | null
          id?: string
          total_losses?: number
          total_wins?: number
          updated_at?: string
          user_id?: string
          win_streak?: number
        }
        Relationships: []
      }
      weekly_leaderboard: {
        Row: {
          created_at: string
          display_name: string
          id: string
          losses: number
          rating_gained: number
          updated_at: string
          user_id: string
          week_key: string
          wins: number
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          losses?: number
          rating_gained?: number
          updated_at?: string
          user_id: string
          week_key: string
          wins?: number
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          losses?: number
          rating_gained?: number
          updated_at?: string
          user_id?: string
          week_key?: string
          wins?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      game_status: "waiting" | "active" | "finished"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      game_status: ["waiting", "active", "finished"],
    },
  },
} as const
