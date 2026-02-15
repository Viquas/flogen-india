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
            batches: {
                Row: {
                    id: string
                    source: string
                    created_at: string
                    status: 'processing' | 'completed' | 'failed'
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    source?: string
                    created_at?: string
                    status?: 'processing' | 'completed' | 'failed'
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    source?: string
                    created_at?: string
                    status?: 'processing' | 'completed' | 'failed'
                    metadata?: Json | null
                }
                Relationships: []
            }
            projects: {
                Row: {
                    id: string
                    batch_id: string | null
                    business_data: Json
                    generated_code: string | null
                    status: 'queued' | 'generating' | 'review' | 'approved' | 'deployed' | 'error'
                    version: number
                    thumbnail_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    batch_id?: string | null
                    business_data: Json
                    generated_code?: string | null
                    status?: 'queued' | 'generating' | 'review' | 'approved' | 'deployed' | 'error'
                    version?: number
                    thumbnail_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    batch_id?: string | null
                    business_data?: Json
                    generated_code?: string | null
                    status?: 'queued' | 'generating' | 'review' | 'approved' | 'deployed' | 'error'
                    version?: number
                    thumbnail_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_batch_id_fkey"
                        columns: ["batch_id"]
                        isOneToOne: false
                        referencedRelation: "batches"
                        referencedColumns: ["id"]
                    }
                ]
            }
            assets: {
                Row: {
                    id: string
                    project_id: string | null
                    storage_path: string
                    public_url: string
                    type: 'image' | 'document' | 'other' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    storage_path: string
                    public_url: string
                    type?: 'image' | 'document' | 'other' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string | null
                    storage_path?: string
                    public_url?: string
                    type?: 'image' | 'document' | 'other' | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "assets_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
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
