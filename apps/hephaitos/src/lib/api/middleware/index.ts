// ============================================
// API Middleware Exports
// ============================================

export {
  withRateLimit,
  checkRateLimit,
  checkUserRateLimit,
  getCategoryFromPath,
  type RateLimitCategory,
  type RateLimitOptions,
} from './rate-limit'

export {
  withErrorHandler,
  withApiMiddleware,
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequestBody,
  validateQueryParams,
  // P0 FIX: Admin Auth
  requireAdminAuth,
  withAdminAuth,
  // P0 FIX: ApiError class for typed errors
  ApiError,
  type ApiHandlerOptions,
  type ApiResponse,
} from './error-handler'
