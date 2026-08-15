/**
 * Supabase database types.
 *
 * Hand-written to match supabase/migrations/20260814120000_documents_and_shares.sql.
 * Regenerate from the live schema once it evolves:
 *
 *   npx supabase gen types typescript --project-id usjvapnpgzbrnaeegxjo > src/lib/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string
          name: string
          user_id: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id?: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          parent_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'folders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'folders_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          id: string
          owner_id: string
          title: string
          storage_path: string
          mime_type: string | null
          size_bytes: number | null
          folder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          title: string
          storage_path: string
          mime_type?: string | null
          size_bytes?: number | null
          folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          storage_path?: string
          mime_type?: string | null
          size_bytes?: number | null
          folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_folder_id_fkey'
            columns: ['folder_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      shares: {
        Row: {
          id: string
          document_id: string | null
          token: string
          expires_at: string | null
          created_by: string
          permission: string
          recipient_email: string | null
          recipient_role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id?: string | null
          token?: string
          expires_at?: string | null
          created_by?: string
          permission?: string
          recipient_email?: string | null
          recipient_role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string | null
          token?: string
          expires_at?: string | null
          created_by?: string
          permission?: string
          recipient_email?: string | null
          recipient_role?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shares_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shares_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      share_documents: {
        Row: {
          id: string
          share_id: string
          document_id: string
          created_at: string
        }
        Insert: {
          id?: string
          share_id: string
          document_id: string
          created_at?: string
        }
        Update: {
          id?: string
          share_id?: string
          document_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'share_documents_share_id_fkey'
            columns: ['share_id']
            isOneToOne: false
            referencedRelation: 'shares'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'share_documents_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
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
