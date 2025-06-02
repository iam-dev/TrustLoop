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
      users: {
        Row: {
          id: string
          wallet_address: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          created_at?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          id: string
          user_id: string
          task_id: string
          timestamp: string
          verified: boolean
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          timestamp?: string
          verified?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          timestamp?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      nfts: {
        Row: {
          id: string
          owner_wallet: string
          task_id: string | null
          metadata_url: string
          asset_id: number | null
          nft_type: string | null
          rarity: string | null
          title: string | null
          description: string | null
          image_url: string | null
          minted_at: string
          is_listed: boolean
        }
        Insert: {
          id?: string
          owner_wallet: string
          task_id?: string | null
          metadata_url: string
          asset_id?: number | null
          nft_type?: string | null
          rarity?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          minted_at?: string
          is_listed?: boolean
        }
        Update: {
          id?: string
          owner_wallet?: string
          task_id?: string | null
          metadata_url?: string
          asset_id?: number | null
          nft_type?: string | null
          rarity?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          minted_at?: string
          is_listed?: boolean
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          id: string
          nft_id: string
          seller_wallet: string
          price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nft_id: string
          seller_wallet: string
          price: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nft_id?: string
          seller_wallet?: string
          price?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_nft_id_fkey"
            columns: ["nft_id"]
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          difficulty: string
          reward_type: string
          reward_amount: number | null
          nft_template_id: string | null
          creator_wallet: string
          created_at: string
          updated_at: string
          active: boolean
        }
        Insert: {
          id: string
          title: string
          description: string
          difficulty: string
          reward_type: string
          reward_amount?: number | null
          nft_template_id?: string | null
          creator_wallet: string
          created_at?: string
          updated_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          difficulty?: string
          reward_type?: string
          reward_amount?: number | null
          nft_template_id?: string | null
          creator_wallet?: string
          created_at?: string
          updated_at?: string
          active?: boolean
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
