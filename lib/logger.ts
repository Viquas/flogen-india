/**
 * Structured logger for WebGen.
 * Outputs JSON-formatted log lines compatible with Vercel's log drain.
 * Each log entry includes timestamp, level, context, and optional requestId.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  requestId?: string
  [key: string]: unknown
}

class Logger {
  private context: string
  private requestId?: string

  constructor(context: string, requestId?: string) {
    this.context = context
    this.requestId = requestId
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      ...(this.requestId && { requestId: this.requestId }),
      ...meta,
    }

    const output = JSON.stringify(entry)

    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'debug':
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta)
  }

  /** Create a child logger with the same context but a specific requestId */
  withRequestId(requestId: string): Logger {
    return new Logger(this.context, requestId)
  }

  /** Create a child logger with a sub-context */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.requestId)
  }

  /** Time a function and log the duration */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      this.info(`${label} completed`, { durationMs: Date.now() - start })
      return result
    } catch (error) {
      this.error(`${label} failed`, {
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

/** Create a logger for a specific module/context */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

// Pre-built loggers for common modules
export const logger = {
  ai: createLogger('ai'),
  api: createLogger('api'),
  queue: createLogger('queue'),
  discovery: createLogger('discovery'),
  screenshot: createLogger('screenshot'),
  autopilot: createLogger('autopilot'),
  db: createLogger('db'),
}
