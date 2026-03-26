import { logger } from '@/lib/logger'

const log = logger.ai.child('circuit-breaker')

type CircuitState = 'closed' | 'open' | 'half-open'

interface ProviderState {
  state: CircuitState
  consecutiveFailures: number
  /** Timestamp of the first failure in the current failure window */
  firstFailureAt: number
  /** Timestamp when circuit was tripped open */
  openedAt: number
  /** Timestamp of the most recent failure (used for least-recently-failed fallback) */
  lastFailureAt: number
}

const FAILURE_THRESHOLD = 3
const FAILURE_WINDOW_MS = 60_000  // 60 seconds
const RECOVERY_TIMEOUT_MS = 30_000 // 30 seconds

export class CircuitBreaker {
  private providers = new Map<string, ProviderState>()

  private getOrCreate(provider: string): ProviderState {
    let state = this.providers.get(provider)
    if (!state) {
      state = {
        state: 'closed',
        consecutiveFailures: 0,
        firstFailureAt: 0,
        openedAt: 0,
        lastFailureAt: 0,
      }
      this.providers.set(provider, state)
    }
    return state
  }

  /**
   * Check if a provider is available for requests.
   * Returns true for closed and half-open circuits.
   */
  canUse(provider: string): boolean {
    const ps = this.getOrCreate(provider)

    if (ps.state === 'closed') return true

    if (ps.state === 'open') {
      // Check if recovery timeout has elapsed -> transition to half-open
      if (Date.now() - ps.openedAt >= RECOVERY_TIMEOUT_MS) {
        ps.state = 'half-open'
        log.info('Circuit half-open, allowing test request', { provider })
        return true
      }
      return false
    }

    // half-open: allow one test request
    return true
  }

  /**
   * Record a successful call. Resets the circuit to closed.
   */
  recordSuccess(provider: string): void {
    const ps = this.getOrCreate(provider)
    if (ps.state !== 'closed') {
      log.info('Circuit closed after successful request', { provider, previousState: ps.state })
    }
    ps.state = 'closed'
    ps.consecutiveFailures = 0
    ps.firstFailureAt = 0
  }

  /**
   * Record a failed call. May trip the circuit open.
   */
  recordFailure(provider: string): void {
    const ps = this.getOrCreate(provider)
    const now = Date.now()

    // If half-open and this test request failed, reopen immediately
    if (ps.state === 'half-open') {
      ps.state = 'open'
      ps.openedAt = now
      ps.lastFailureAt = now
      log.warn('Circuit reopened after failed test request', { provider })
      return
    }

    // Reset failure count if outside the failure window
    if (ps.firstFailureAt && now - ps.firstFailureAt > FAILURE_WINDOW_MS) {
      ps.consecutiveFailures = 0
      ps.firstFailureAt = 0
    }

    ps.consecutiveFailures++
    ps.lastFailureAt = now
    if (!ps.firstFailureAt) ps.firstFailureAt = now

    if (ps.consecutiveFailures >= FAILURE_THRESHOLD) {
      ps.state = 'open'
      ps.openedAt = now
      log.warn('Circuit tripped open', {
        provider,
        failures: ps.consecutiveFailures,
        windowMs: now - ps.firstFailureAt,
      })
    }
  }

  /**
   * Get the timestamp of the last failure for a provider.
   * Returns 0 if provider has never failed. Used for least-recently-failed fallback.
   */
  getLastFailureAt(provider: string): number {
    return this.getOrCreate(provider).lastFailureAt
  }

  /** Get current state for a provider (useful for debugging/monitoring). */
  getState(provider: string): CircuitState {
    return this.getOrCreate(provider).state
  }
}

/** Singleton circuit breaker instance */
export const circuitBreaker = new CircuitBreaker()
