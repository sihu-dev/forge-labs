/**
 * 웹훅 트리거 핸들러
 *
 * n8n 웹훅 엔드포인트 처리
 */

import type { IWebhookTrigger, IWorkflowExecution } from '../types.js';

export interface IWebhookPayload {
  workflow_id: string;
  trigger_path: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  timestamp: string;
}

export interface IWebhookValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 웹훅 페이로드 검증
 */
export function validateWebhookPayload(
  payload: IWebhookPayload,
  config: IWebhookTrigger
): IWebhookValidationResult {
  // HTTP 메서드 검증
  if (payload.method !== config.method) {
    return {
      valid: false,
      error: `Invalid HTTP method. Expected ${config.method}, got ${payload.method}`,
    };
  }

  // 인증 검증
  if (config.authentication === 'basicAuth') {
    const authHeader = payload.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return {
        valid: false,
        error: 'Missing or invalid Basic Auth header',
      };
    }
  } else if (config.authentication === 'headerAuth') {
    const apiKey = payload.headers['x-api-key'] || payload.headers['x-n8n-api-key'];
    if (!apiKey) {
      return {
        valid: false,
        error: 'Missing API key in headers',
      };
    }
  }

  // 페이로드 검증
  if (payload.method === 'POST' || payload.method === 'PUT' || payload.method === 'PATCH') {
    if (!payload.body) {
      return {
        valid: false,
        error: 'Missing request body',
      };
    }
  }

  return { valid: true };
}

/**
 * 웹훅 응답 생성
 */
export function createWebhookResponse(
  execution: IWorkflowExecution,
  config: IWebhookTrigger
): {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
} {
  const headers = {
    'Content-Type': 'application/json',
  };

  // responseMode에 따른 응답 처리
  switch (config.responseMode) {
    case 'onReceived':
      // 즉시 응답 (비동기 처리)
      return {
        statusCode: 202,
        body: {
          message: 'Webhook received and processing',
          execution_id: execution.id,
        },
        headers,
      };

    case 'lastNode':
      // 워크플로우 완료 후 마지막 노드 데이터 반환
      if (execution.status === 'success') {
        return {
          statusCode: 200,
          body: execution.data?.resultData.runData || {},
          headers,
        };
      } else if (execution.status === 'error') {
        return {
          statusCode: 500,
          body: {
            error: execution.error || 'Workflow execution failed',
            execution_id: execution.id,
          },
          headers,
        };
      } else {
        return {
          statusCode: 102,
          body: {
            message: 'Workflow is processing',
            execution_id: execution.id,
          },
          headers,
        };
      }

    case 'responseNode':
      // 특정 "Respond to Webhook" 노드의 데이터 반환
      // (구현 생략 - 실제로는 특정 노드 찾아서 반환)
      return {
        statusCode: 200,
        body: execution.data?.resultData.runData || {},
        headers,
      };

    default:
      return {
        statusCode: 200,
        body: {
          execution_id: execution.id,
          status: execution.status,
        },
        headers,
      };
  }
}

/**
 * 웹훅 URL 생성
 */
export function generateWebhookUrl(baseUrl: string, path: string, webhookId: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/webhook/${cleanPath}/${webhookId}`;
}

/**
 * 웹훅 시크릿 생성 (HMAC 서명용)
 */
export function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * HMAC 서명 검증
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}
