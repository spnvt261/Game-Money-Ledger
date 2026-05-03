export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      configuration: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      app_sessions: {
        Row: {
          id: string
          token_hash: string
          role: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          token_hash: string
          role?: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          token_hash?: string
          role?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          display_name: string
          slug: string
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_name: string
          slug: string
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          slug?: string
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          game_type: 'TFT' | 'BILLIARD'
          status: 'COMPLETED' | 'VOIDED'
          note: string | null
          played_at: string
          metadata: Json
          created_by_session_id: string | null
          created_at: string
          voided_at: string | null
          void_reason: string | null
        }
        Insert: {
          id?: string
          game_type: 'TFT' | 'BILLIARD'
          status?: 'COMPLETED' | 'VOIDED'
          note?: string | null
          played_at?: string
          metadata?: Json
          created_by_session_id?: string | null
          created_at?: string
          voided_at?: string | null
          void_reason?: string | null
        }
        Update: {
          id?: string
          game_type?: 'TFT' | 'BILLIARD'
          status?: 'COMPLETED' | 'VOIDED'
          note?: string | null
          played_at?: string
          metadata?: Json
          created_by_session_id?: string | null
          created_at?: string
          voided_at?: string | null
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'matches_created_by_session_id_fkey'
            columns: ['created_by_session_id']
            referencedRelation: 'app_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      match_participants: {
        Row: {
          id: string
          match_id: string
          player_id: string
          placement: number | null
          net_amount: number
          metadata: Json
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          placement?: number | null
          net_amount: number
          metadata?: Json
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          placement?: number | null
          net_amount?: number
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'match_participants_match_id_fkey'
            columns: ['match_id']
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'match_participants_player_id_fkey'
            columns: ['player_id']
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      ledger_events: {
        Row: {
          id: string
          event_type: 'MATCH' | 'VOID' | 'SETTLEMENT' | 'ADJUSTMENT'
          match_id: string | null
          note: string | null
          occurred_at: string
          created_by_session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'MATCH' | 'VOID' | 'SETTLEMENT' | 'ADJUSTMENT'
          match_id?: string | null
          note?: string | null
          occurred_at?: string
          created_by_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: 'MATCH' | 'VOID' | 'SETTLEMENT' | 'ADJUSTMENT'
          match_id?: string | null
          note?: string | null
          occurred_at?: string
          created_by_session_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ledger_events_created_by_session_id_fkey'
            columns: ['created_by_session_id']
            referencedRelation: 'app_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ledger_events_match_id_fkey'
            columns: ['match_id']
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
        ]
      }
      ledger_lines: {
        Row: {
          id: string
          event_id: string
          player_id: string
          amount: number
          metadata: Json
        }
        Insert: {
          id?: string
          event_id: string
          player_id: string
          amount: number
          metadata?: Json
        }
        Update: {
          id?: string
          event_id?: string
          player_id?: string
          amount?: number
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'ledger_lines_event_id_fkey'
            columns: ['event_id']
            referencedRelation: 'ledger_events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ledger_lines_player_id_fkey'
            columns: ['player_id']
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      v_player_balances: {
        Row: {
          player_id: string
          display_name: string
          avatar_url: string | null
          is_active: boolean
          balance_amount: number
          match_count: number
        }
        Relationships: []
      }
      v_match_history: {
        Row: {
          match_id: string
          game_type: 'TFT' | 'BILLIARD'
          status: 'COMPLETED' | 'VOIDED'
          played_at: string
          note: string | null
          participant_count: number
          total_positive_amount: number
          total_negative_amount: number
        }
        Relationships: []
      }
      v_dashboard_summary: {
        Row: {
          total_players: number
          active_players: number
          total_matches: number
          total_completed_matches: number
          total_voided_matches: number
          total_money_moved: number
        }
        Relationships: []
      }
      v_player_stats: {
        Row: {
          player_id: string
          display_name: string
          total_matches: number
          total_win_amount: number
          total_loss_amount: number
          balance_amount: number
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_key: {
        Args: {
          input_key: string
        }
        Returns: {
          session_token: string
          role: string
          expires_at: string
        }[]
      }
      create_match: {
        Args: {
          payload: Json
          session_token: string
        }
        Returns: Json
      }
      void_match: {
        Args: {
          match_id: string
          reason: string
          session_token: string
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
