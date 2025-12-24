/**
 * BIDFLOW API Client
 * HTTP client for calling BIDFLOW Next.js API routes
 */

const BIDFLOW_API_URL = process.env.BIDFLOW_API_URL || 'http://localhost:3010';
const BIDFLOW_API_KEY = process.env.BIDFLOW_API_KEY;

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export async function callBidflowAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = `${BIDFLOW_API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(BIDFLOW_API_KEY && { 'X-API-Key': BIDFLOW_API_KEY }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.error?.message || response.statusText,
          details: errorData.error?.details,
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
