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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          reward_coins: number
        }
        Insert: {
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          reward_coins?: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          reward_coins?: number
        }
        Relationships: []
      }
      battle_pass_seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      battle_pass_tiers: {
        Row: {
          free_reward_type: string
          free_reward_value: string | null
          id: string
          premium_reward_type: string
          premium_reward_value: string | null
          season_id: string | null
          tier_number: number
          xp_required: number
        }
        Insert: {
          free_reward_type: string
          free_reward_value?: string | null
          id?: string
          premium_reward_type: string
          premium_reward_value?: string | null
          season_id?: string | null
          tier_number: number
          xp_required: number
        }
        Update: {
          free_reward_type?: string
          free_reward_value?: string | null
          id?: string
          premium_reward_type?: string
          premium_reward_value?: string | null
          season_id?: string | null
          tier_number?: number
          xp_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_defeats: {
        Row: {
          boss_type: string
          defeated_at: string
          distance_at_defeat: number | null
          id: string
          kill_time_seconds: number | null
          profile_id: string
        }
        Insert: {
          boss_type: string
          defeated_at?: string
          distance_at_defeat?: number | null
          id?: string
          kill_time_seconds?: number | null
          profile_id: string
        }
        Update: {
          boss_type?: string
          defeated_at?: string
          distance_at_defeat?: number | null
          id?: string
          kill_time_seconds?: number | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boss_defeats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skins: {
        Row: {
          coin_multiplier: number
          description: string | null
          id: string
          is_premium: boolean
          jump_power_bonus: number
          name: string
          price: number
          shield_duration_bonus: number
          speed_bonus: number
        }
        Insert: {
          coin_multiplier?: number
          description?: string | null
          id: string
          is_premium?: boolean
          jump_power_bonus?: number
          name: string
          price?: number
          shield_duration_bonus?: number
          speed_bonus?: number
        }
        Update: {
          coin_multiplier?: number
          description?: string | null
          id?: string
          is_premium?: boolean
          jump_power_bonus?: number
          name?: string
          price?: number
          shield_duration_bonus?: number
          speed_bonus?: number
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          icon: string
          id: string
          reward_coins: number
          target_value: number
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          reward_coins?: number
          target_value: number
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          reward_coins?: number
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          claimed_at: string
          coins_reward: number
          day_number: number
          id: string
          profile_id: string
        }
        Insert: {
          claimed_at?: string
          coins_reward: number
          day_number: number
          id?: string
          profile_id: string
        }
        Update: {
          claimed_at?: string
          coins_reward?: number
          day_number?: number
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rewards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          character_skin: string
          created_at: string
          distance: number
          id: string
          profile_id: string
          score: number
        }
        Insert: {
          character_skin?: string
          created_at?: string
          distance: number
          id?: string
          profile_id: string
          score: number
        }
        Update: {
          character_skin?: string
          created_at?: string
          distance?: number
          id?: string
          profile_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owned_skins: {
        Row: {
          id: string
          profile_id: string
          purchased_at: string
          skin_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          purchased_at?: string
          skin_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          purchased_at?: string
          skin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owned_skins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owned_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "character_skins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coins: number
          created_at: string
          current_world: string
          high_score: number
          id: string
          last_daily_claim: string | null
          login_streak: number
          total_distance: number
          total_runs: number
          tutorial_completed: boolean
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          coins?: number
          created_at?: string
          current_world?: string
          high_score?: number
          id?: string
          last_daily_claim?: string | null
          login_streak?: number
          total_distance?: number
          total_runs?: number
          tutorial_completed?: boolean
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Update: {
          coins?: number
          created_at?: string
          current_world?: string
          high_score?: number
          id?: string
          last_daily_claim?: string | null
          login_streak?: number
          total_distance?: number
          total_runs?: number
          tutorial_completed?: boolean
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          profile_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          id?: string
          profile_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          id?: string
          profile_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_battle_pass: {
        Row: {
          claimed_free_tiers: number[] | null
          claimed_premium_tiers: number[] | null
          created_at: string
          current_tier: number
          current_xp: number
          id: string
          is_premium: boolean
          profile_id: string
          season_id: string
          updated_at: string
        }
        Insert: {
          claimed_free_tiers?: number[] | null
          claimed_premium_tiers?: number[] | null
          created_at?: string
          current_tier?: number
          current_xp?: number
          id?: string
          is_premium?: boolean
          profile_id: string
          season_id: string
          updated_at?: string
        }
        Update: {
          claimed_free_tiers?: number[] | null
          claimed_premium_tiers?: number[] | null
          created_at?: string
          current_tier?: number
          current_xp?: number
          id?: string
          is_premium?: boolean
          profile_id?: string
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_battle_pass_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_battle_pass_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenges: {
        Row: {
          challenge_date: string
          challenge_id: string
          created_at: string
          current_progress: number
          id: string
          is_claimed: boolean
          is_completed: boolean
          profile_id: string
        }
        Insert: {
          challenge_date?: string
          challenge_id: string
          created_at?: string
          current_progress?: number
          id?: string
          is_claimed?: boolean
          is_completed?: boolean
          profile_id: string
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          created_at?: string
          current_progress?: number
          id?: string
          is_claimed?: boolean
          is_completed?: boolean
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_challenges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_daily_bonuses: {
        Row: {
          bonus_coins: number
          bonus_day: number
          claimed_at: string
          id: string
          profile_id: string
        }
        Insert: {
          bonus_coins?: number
          bonus_day?: number
          claimed_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          bonus_coins?: number
          bonus_day?: number
          claimed_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_daily_bonuses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          profile_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          profile_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          profile_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
