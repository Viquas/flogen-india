import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('versioning')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionConfig {
  /** Supabase table name, e.g. 'templates' or 'design_languages' */
  tableName: string
  /** The column that holds the main content, e.g. 'generated_code' for templates */
  contentField: string
}

export interface VersionEntry {
  id: string
  version: number
  parent_id: string | null
  change_notes: string | null
  is_active: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table access requires untyped client
type AnyClient = ReturnType<typeof createAdminClient> & { from: (table: string) => any }

/**
 * Get a Supabase client that can query arbitrary table names.
 * The typed client restricts .from() to known table names, but this utility
 * is generic across tables. We cast once here instead of on every call.
 */
function getClient(): AnyClient {
  return createAdminClient() as AnyClient
}

/**
 * Check whether the versioning columns exist on the given table.
 * Returns true if the table supports versioning, false otherwise.
 * This allows the system to work gracefully before the migration runs.
 */
async function supportsVersioning(config: VersionConfig): Promise<boolean> {
  try {
    const supabase = getClient()
    // Attempt a lightweight query that references the versioning columns.
    // If they don't exist Supabase will return a 400/column-not-found error.
    const { error } = await supabase
      .from(config.tableName)
      .select('version, parent_id, is_active')
      .limit(0)

    if (error) {
      log.debug('Versioning columns not found, falling back to simple mode', {
        table: config.tableName,
        error: error.message,
      })
      return false
    }
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new version of an existing record.
 *
 * Strategy (append-only):
 *  1. Read the current active row
 *  2. Insert a new row with incremented version + parent_id pointing to original
 *  3. Mark the old row as is_active = false
 *
 * If versioning columns don't exist yet, falls back to a simple in-place update.
 *
 * @returns The newly created version row (or the updated row in fallback mode)
 */
export async function createVersion<T extends Record<string, unknown>>(
  config: VersionConfig,
  id: string,
  updates: Partial<T>,
  changeNotes?: string,
): Promise<{ success: true; data: T; versioned: boolean } | { success: false; error: string }> {
  const supabase = getClient()
  const hasVersioning = await supportsVersioning(config)

  if (!hasVersioning) {
    // Fallback: simple in-place update (pre-migration behaviour)
    const { data, error } = await supabase
      .from(config.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      log.error('Fallback update failed', { table: config.tableName, id, error: error.message })
      return { success: false, error: error.message }
    }

    log.info('Updated record (no versioning)', { table: config.tableName, id })
    return { success: true, data: data as T, versioned: false }
  }

  // --- Full versioning path ---

  // 1. Fetch the current active record
  const { data: current, error: fetchErr } = await supabase
    .from(config.tableName)
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !current) {
    log.error('Failed to fetch current record for versioning', {
      table: config.tableName,
      id,
      error: fetchErr?.message,
    })
    return { success: false, error: fetchErr?.message ?? 'Record not found' }
  }

  const row = current as Record<string, unknown>

  // Determine the "original" id (root of the version chain).
  // If this record already has a parent_id, use that as root. Otherwise the id IS the root.
  const originalId: string = (row.parent_id as string) ?? id
  const currentVersion: number = (row.version as number) ?? 1

  // 2. Build the new row — clone current, apply updates, bump version
  const {
    id: _discardId,
    created_at: _discardCreatedAt,
    ...rest
  } = row

  const newRow = {
    ...rest,
    ...updates,
    version: currentVersion + 1,
    parent_id: originalId,
    change_notes: changeNotes ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  const { data: inserted, error: insertErr } = await supabase
    .from(config.tableName)
    .insert(newRow)
    .select()
    .single()

  if (insertErr) {
    log.error('Failed to insert new version', {
      table: config.tableName,
      id,
      error: insertErr.message,
    })
    return { success: false, error: insertErr.message }
  }

  const insertedRow = inserted as Record<string, unknown>

  // 3. Deactivate the old version
  const { error: deactivateErr } = await supabase
    .from(config.tableName)
    .update({ is_active: false })
    .eq('id', id)

  if (deactivateErr) {
    log.warn('Failed to deactivate old version — new version was still created', {
      table: config.tableName,
      oldId: id,
      newId: insertedRow.id,
      error: deactivateErr.message,
    })
  }

  log.info('Created new version', {
    table: config.tableName,
    oldId: id,
    newId: insertedRow.id,
    version: currentVersion + 1,
  })

  return { success: true, data: inserted as T, versioned: true }
}

/**
 * Get the full version history for a record (by its original/root id).
 * Returns versions ordered newest-first.
 *
 * Falls back to returning just the single record if versioning columns don't exist.
 */
export async function getVersionHistory<T = Record<string, unknown>>(
  config: VersionConfig,
  parentId: string,
): Promise<{ success: true; data: T[] } | { success: false; error: string }> {
  const supabase = getClient()
  const hasVersioning = await supportsVersioning(config)

  if (!hasVersioning) {
    // Fallback: just return the single record
    const { data, error } = await supabase
      .from(config.tableName)
      .select('*')
      .eq('id', parentId)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, data: (data ?? []) as T[] }
  }

  // Fetch all versions: the original row (id = parentId) + all rows with parent_id = parentId
  const { data, error } = await supabase
    .from(config.tableName)
    .select('*')
    .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
    .order('version', { ascending: false })

  if (error) {
    log.error('Failed to fetch version history', {
      table: config.tableName,
      parentId,
      error: error.message,
    })
    return { success: false, error: error.message }
  }

  return { success: true, data: (data ?? []) as T[] }
}

/**
 * Get a specific version by its row id.
 */
export async function getVersion<T = Record<string, unknown>>(
  config: VersionConfig,
  versionId: string,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from(config.tableName)
    .select('*')
    .eq('id', versionId)
    .single()

  if (error) {
    log.error('Failed to fetch version', {
      table: config.tableName,
      versionId,
      error: error.message,
    })
    return { success: false, error: error.message }
  }

  return { success: true, data: data as T }
}

/**
 * Soft-delete a record by setting is_active = false.
 * Falls back to a hard delete if versioning columns don't exist.
 *
 * @returns Whether a soft-delete was performed (true) or hard-delete fallback (false).
 */
export async function softDelete(
  config: VersionConfig,
  id: string,
): Promise<{ success: true; softDeleted: boolean } | { success: false; error: string }> {
  const supabase = getClient()
  const hasVersioning = await supportsVersioning(config)

  if (!hasVersioning) {
    const { error } = await supabase.from(config.tableName).delete().eq('id', id)
    if (error) {
      log.error('Hard delete failed', { table: config.tableName, id, error: error.message })
      return { success: false, error: error.message }
    }
    log.info('Hard-deleted record (no versioning columns)', { table: config.tableName, id })
    return { success: true, softDeleted: false }
  }

  const { error } = await supabase
    .from(config.tableName)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    log.error('Soft delete failed', { table: config.tableName, id, error: error.message })
    return { success: false, error: error.message }
  }

  log.info('Soft-deleted record', { table: config.tableName, id })
  return { success: true, softDeleted: true }
}

/**
 * Restore a specific version by making it the active one and deactivating the current active.
 */
export async function restoreVersion(
  config: VersionConfig,
  versionId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getClient()
  const hasVersioning = await supportsVersioning(config)

  if (!hasVersioning) {
    return { success: false, error: 'Versioning not available — migration has not been applied' }
  }

  // Get the version to restore
  const { data: version, error: fetchErr } = await supabase
    .from(config.tableName)
    .select('parent_id, id')
    .eq('id', versionId)
    .single()

  if (fetchErr || !version) {
    return { success: false, error: fetchErr?.message ?? 'Version not found' }
  }

  const versionRow = version as Record<string, unknown>
  const rootId = (versionRow.parent_id as string) ?? versionId

  // Deactivate all versions in this chain
  const { error: deactivateErr } = await supabase
    .from(config.tableName)
    .update({ is_active: false })
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)

  if (deactivateErr) {
    log.error('Failed to deactivate versions during restore', {
      table: config.tableName,
      versionId,
      error: deactivateErr.message,
    })
    return { success: false, error: deactivateErr.message }
  }

  // Activate the target version
  const { error: activateErr } = await supabase
    .from(config.tableName)
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', versionId)

  if (activateErr) {
    log.error('Failed to activate restored version', {
      table: config.tableName,
      versionId,
      error: activateErr.message,
    })
    return { success: false, error: activateErr.message }
  }

  log.info('Restored version', { table: config.tableName, versionId, rootId })
  return { success: true }
}
