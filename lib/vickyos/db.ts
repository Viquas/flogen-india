import { Pool } from 'pg'
import { SUPABASE_CA } from './supabase-ca'

/**
 * VickyOS API database access. Connects as the `vickyos_reader` Postgres role
 * (SELECT-only grants on projects/call_logs/outreach_messages/interests/claims/
 * queue_jobs — see README-vickyos-api.md). Deliberately NOT the service-role
 * Supabase client: the role cannot write, cannot read auth.users, and cannot
 * read raw scrape staging (lead_lists), so the API is read-only by construction.
 */

let pool: Pool | null = null

export function getVickyosPool(): Pool {
    if (!pool) {
        const url = process.env.VICKYOS_DB_URL
        if (!url) throw new Error('VICKYOS_DB_URL is not set')
        pool = new Pool({
            connectionString: url,
            max: 3,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 10_000,
            // Full TLS verification against Supabase's own CA (the pooler cert
            // is not signed by a public CA, so the chain is pinned in-repo).
            ssl: { ca: SUPABASE_CA, rejectUnauthorized: true },
        })
    }
    return pool
}
