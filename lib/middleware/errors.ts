/**
 * Standardized HTTP error classes for API routes.
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(400, message, code)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(404, message, code)
    this.name = 'NotFoundError'
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too Many Requests', code = 'RATE_LIMITED') {
    super(429, message, code)
    this.name = 'TooManyRequestsError'
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    super(500, message, code)
    this.name = 'InternalError'
  }
}
