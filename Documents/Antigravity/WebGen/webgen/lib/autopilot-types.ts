/**
 * Autopilot Pipeline Types
 *
 * Type definitions for the batch autopilot state machine.
 * The pipeline stages form a linear progression:
 *   pending -> discovering -> enqueueing -> generating -> fixing -> scoring -> completed
 * With 'failed' as a terminal state reachable from any stage.
 */

export type PipelineStage =
  | 'pending'
  | 'discovering'
  | 'enqueueing'
  | 'generating'
  | 'fixing'
  | 'scoring'
  | 'completed'
  | 'failed'

export interface BatchRunConfig {
  query: string
  location: string
  industry: string
  entries: number
  templateId?: string
  autoFixEnabled: boolean
  qualityThreshold: number
}

export interface BatchProgress {
  total_projects: number
  generated: number
  fixed: number
  failed: number
  avg_quality_score: number | null
}

export interface BatchRun {
  id: string
  batch_id: string | null
  current_stage: PipelineStage
  config: BatchRunConfig
  progress: BatchProgress
  error_message: string | null
  started_at: string
  completed_at: string | null
  updated_at: string
}

export interface DiscoveryResult {
  batchId: string
  projectIds: string[]
  count: number
}
