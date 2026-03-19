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
                    design_language: string | null
                    status: 'queued' | 'generating' | 'review' | 'approved' | 'deployed' | 'error'
                    version: number
                    thumbnail_url: string | null
                    generation_phase: string | null
                    error_type: string | null
                    error_details: string | null
                    prompt_version_id: string | null
                    quality_score: number | null
                    slug: string | null
                    claim_expires_at: string | null
                    screenshot_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    batch_id?: string | null
                    business_data: Json
                    generated_code?: string | null
                    design_language?: string | null
                    status?: 'queued' | 'generating' | 'review' | 'approved' | 'deployed' | 'error'
                    version?: number
                    thumbnail_url?: string | null
                    generation_phase?: string | null
                    error_type?: string | null
                    error_details?: string | null
                    prompt_version_id?: string | null
                    quality_score?: number | null
                    slug?: string | null
                    claim_expires_at?: string | null
                    screenshot_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    batch_id?: string | null
                    business_data?: Json
                    generated_code?: string | null
                    design_language?: string | null
                    status?: 'queued' | 'generating' | 'review' | 'approved' | 'deployed' | 'error'
                    version?: number
                    thumbnail_url?: string | null
                    generation_phase?: string | null
                    error_type?: string | null
                    error_details?: string | null
                    prompt_version_id?: string | null
                    quality_score?: number | null
                    slug?: string | null
                    claim_expires_at?: string | null
                    screenshot_url?: string | null
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
            claim_events: {
                Row: {
                    id: string
                    site_slug: string
                    event_type: string
                    ip: string | null
                    user_agent: string | null
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    site_slug: string
                    event_type: string
                    ip?: string | null
                    user_agent?: string | null
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    site_slug?: string
                    event_type?: string
                    ip?: string | null
                    user_agent?: string | null
                    metadata?: Json
                    created_at?: string
                }
                Relationships: []
            }
            claims: {
                Row: {
                    id: string
                    project_id: string
                    status: 'pending' | 'order_created' | 'paid' | 'customizing' | 'completed' | 'expired' | 'cancelled'
                    plan: 'standard' | 'pro'
                    amount_paise: number
                    currency: string
                    razorpay_order_id: string | null
                    razorpay_payment_id: string | null
                    razorpay_signature: string | null
                    client_name: string | null
                    client_email: string | null
                    client_phone: string | null
                    domain_option: 'subdomain' | 'existing' | 'new' | null
                    domain_value: string | null
                    expires_at: string
                    paid_at: string | null
                    webhook_event_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    status?: 'pending' | 'order_created' | 'paid' | 'customizing' | 'completed' | 'expired' | 'cancelled'
                    plan: 'standard' | 'pro'
                    amount_paise: number
                    currency?: string
                    razorpay_order_id?: string | null
                    razorpay_payment_id?: string | null
                    razorpay_signature?: string | null
                    client_name?: string | null
                    client_email?: string | null
                    client_phone?: string | null
                    domain_option?: 'subdomain' | 'existing' | 'new' | null
                    domain_value?: string | null
                    expires_at: string
                    paid_at?: string | null
                    webhook_event_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    status?: 'pending' | 'order_created' | 'paid' | 'customizing' | 'completed' | 'expired' | 'cancelled'
                    plan?: 'standard' | 'pro'
                    amount_paise?: number
                    currency?: string
                    razorpay_order_id?: string | null
                    razorpay_payment_id?: string | null
                    razorpay_signature?: string | null
                    client_name?: string | null
                    client_email?: string | null
                    client_phone?: string | null
                    domain_option?: 'subdomain' | 'existing' | 'new' | null
                    domain_value?: string | null
                    expires_at?: string
                    paid_at?: string | null
                    webhook_event_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "claims_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            customizations: {
                Row: {
                    id: string
                    claim_id: string
                    logo_url: string | null
                    primary_color: string | null
                    secondary_color: string | null
                    phone: string | null
                    email: string | null
                    address: string | null
                    tagline: string | null
                    about_text: string | null
                    photo_urls: Json
                    notes: string | null
                    wants_booking_system: boolean
                    booking_preferences: Json | null
                    wants_strategy_call: boolean
                    preferred_call_time: string | null
                    status: 'pending' | 'in_review' | 'applied' | 'delivered'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    claim_id: string
                    logo_url?: string | null
                    primary_color?: string | null
                    secondary_color?: string | null
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    tagline?: string | null
                    about_text?: string | null
                    photo_urls?: Json
                    notes?: string | null
                    wants_booking_system?: boolean
                    booking_preferences?: Json | null
                    wants_strategy_call?: boolean
                    preferred_call_time?: string | null
                    status?: 'pending' | 'in_review' | 'applied' | 'delivered'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    claim_id?: string
                    logo_url?: string | null
                    primary_color?: string | null
                    secondary_color?: string | null
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    tagline?: string | null
                    about_text?: string | null
                    photo_urls?: Json
                    notes?: string | null
                    wants_booking_system?: boolean
                    booking_preferences?: Json | null
                    wants_strategy_call?: boolean
                    preferred_call_time?: string | null
                    status?: 'pending' | 'in_review' | 'applied' | 'delivered'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "customizations_claim_id_fkey"
                        columns: ["claim_id"]
                        isOneToOne: false
                        referencedRelation: "claims"
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
