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
                    generation_phase: string | null
                    error_type: string | null
                    error_details: string | null
                    prompt_version_id: string | null
                    quality_score: number | null
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
                    generation_phase?: string | null
                    error_type?: string | null
                    error_details?: string | null
                    prompt_version_id?: string | null
                    quality_score?: number | null
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
                    generation_phase?: string | null
                    error_type?: string | null
                    error_details?: string | null
                    prompt_version_id?: string | null
                    quality_score?: number | null
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
            configurations: {
                Row: {
                    id: string
                    key: string
                    value: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: string
                    updated_at?: string
                }
                Relationships: []
            }
            project_revisions: {
                Row: {
                    id: string
                    project_id: string | null
                    business_data: Json
                    generated_code: string | null
                    version: number
                    created_at: string
                    updated_at: string
                    status?: 'draft' | 'generating' | 'review' | 'published' | 'error'
                    generation_phase?: string | null
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    business_data?: Json
                    generated_code?: string | null
                    version?: number
                    created_at?: string
                    updated_at?: string
                    status?: 'draft' | 'generating' | 'review' | 'published' | 'error'
                    generation_phase?: string | null
                }
                Update: {
                    id?: string
                    project_id?: string | null
                    business_data?: Json
                    generated_code?: string | null
                    version?: number
                    created_at?: string
                    updated_at?: string
                    status?: 'draft' | 'generating' | 'review' | 'published' | 'error'
                    generation_phase?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "project_revisions_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            queue_jobs: {
                Row: {
                    id: string
                    project_id: string | null
                    rules: string | null
                    template_id: string | null
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    error_message: string | null
                    attempts: number
                    started_at: string | null
                    completed_at: string | null
                    model_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    rules?: string | null
                    template_id?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    error_message?: string | null
                    attempts?: number
                    started_at?: string | null
                    completed_at?: string | null
                    model_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string | null
                    rules?: string | null
                    template_id?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    error_message?: string | null
                    attempts?: number
                    started_at?: string | null
                    completed_at?: string | null
                    model_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "queue_jobs_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "queue_jobs_template_id_fkey"
                        columns: ["template_id"]
                        isOneToOne: false
                        referencedRelation: "templates"
                        referencedColumns: ["id"]
                    }
                ]
            }
            templates: {
                Row: {
                    id: string
                    name: string
                    industry_tag: string
                    rating: number
                    generated_code: string
                    business_data: Json | null
                    source_project_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    industry_tag?: string
                    rating?: number
                    generated_code: string
                    business_data?: Json | null
                    source_project_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    industry_tag?: string
                    rating?: number
                    generated_code?: string
                    business_data?: Json | null
                    source_project_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "templates_source_project_id_fkey"
                        columns: ["source_project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            prompt_versions: {
                Row: {
                    id: string
                    name: string
                    version: number
                    content: string
                    is_active: boolean
                    change_notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    version: number
                    content: string
                    is_active?: boolean
                    change_notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    version?: number
                    content?: string
                    is_active?: boolean
                    change_notes?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            batch_runs: {
                Row: {
                    id: string
                    batch_id: string | null
                    current_stage: 'pending' | 'discovering' | 'enqueueing' | 'generating' | 'fixing' | 'scoring' | 'completed' | 'failed'
                    config: Json
                    progress: Json
                    error_message: string | null
                    started_at: string
                    completed_at: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    batch_id?: string | null
                    current_stage?: 'pending' | 'discovering' | 'enqueueing' | 'generating' | 'fixing' | 'scoring' | 'completed' | 'failed'
                    config: Json
                    progress?: Json
                    error_message?: string | null
                    started_at?: string
                    completed_at?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    batch_id?: string | null
                    current_stage?: 'pending' | 'discovering' | 'enqueueing' | 'generating' | 'fixing' | 'scoring' | 'completed' | 'failed'
                    config?: Json
                    progress?: Json
                    error_message?: string | null
                    started_at?: string
                    completed_at?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "batch_runs_batch_id_fkey"
                        columns: ["batch_id"]
                        isOneToOne: false
                        referencedRelation: "batches"
                        referencedColumns: ["id"]
                    }
                ]
            }
            generation_costs: {
                Row: {
                    id: string
                    project_id: string | null
                    model: string
                    call_type: string
                    input_tokens: number
                    output_tokens: number
                    total_tokens: number
                    estimated_cost_usd: number
                    prompt_version_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    model: string
                    call_type: string
                    input_tokens?: number
                    output_tokens?: number
                    total_tokens?: number
                    estimated_cost_usd?: number
                    prompt_version_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string | null
                    model?: string
                    call_type?: string
                    input_tokens?: number
                    output_tokens?: number
                    total_tokens?: number
                    estimated_cost_usd?: number
                    prompt_version_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "generation_costs_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "generation_costs_prompt_version_id_fkey"
                        columns: ["prompt_version_id"]
                        isOneToOne: false
                        referencedRelation: "prompt_versions"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            list_tables_v1: {
                Args: Record<string, never>
                Returns: unknown
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
