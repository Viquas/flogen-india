/**
 * Shared cross-table place_id dedup for the two discovery paths.
 *
 * Historically each path only checked its own table:
 *   - lib/discovery.ts (admin site-gen) checked projects.business_data->>'placeId'
 *   - lib/lead-discovery.ts (sales)      checked lead_lists.place_id
 * and the two paths write the Places id under DIFFERENT json keys in projects
 * (admin: `placeId` camelCase, sales-promoted: `place_id` snake_case). The result:
 * the same business discovered by both paths produced two projects — wasted
 * generation spend and a double cold-outreach track to one business.
 *
 * This helper returns every place_id from the input set that already exists
 * ANYWHERE (lead_lists OR projects, either json key), so both paths exclude the
 * same duplicates. Backed by the expression indexes in migration
 * 20260716000001_... / 20260716000002_project_place_id_dedup_index.sql.
 */

const PROJECT_PLACE_ID_KEYS = ['placeId', 'place_id'] as const

export async function findExistingPlaceIds(
  // Admin Supabase client; typed loosely because JSON-path filters aren't in the
  // generated types (same `as any` pattern used across the discovery modules).
  supabase: any,
  placeIds: string[],
): Promise<Set<string>> {
  const found = new Set<string>()
  const ids = placeIds.filter(Boolean)
  if (ids.length === 0) return found

  // Already saved as a lead.
  const { data: leads } = await supabase
    .from('lead_lists')
    .select('place_id')
    .in('place_id', ids)
  for (const l of leads || []) {
    if (l.place_id) found.add(l.place_id as string)
  }

  // Already a project (generated or promoted) under either json key casing.
  for (const key of PROJECT_PLACE_ID_KEYS) {
    const { data: projs } = await supabase
      .from('projects')
      .select('business_data')
      .in(`business_data->>${key}`, ids)
    for (const p of projs || []) {
      const bd = (p.business_data ?? {}) as Record<string, unknown>
      const pid = (bd.placeId ?? bd.place_id) as string | undefined
      if (pid) found.add(pid)
    }
  }

  return found
}
