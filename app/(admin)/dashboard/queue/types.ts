export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  stuck: number // processing > 10 min
}

export interface QueueJobDetail {
  id: string
  project_id: string | null
  status: string
  error_message: string | null
  attempts: number
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  model_id: string | null
  rules: string | null
  is_stuck: boolean
}
