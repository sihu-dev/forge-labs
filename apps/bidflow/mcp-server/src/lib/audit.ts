/**
 * Audit Logging
 * Logs MCP tool calls and resource access for security and compliance
 */

import { createWriteStream, WriteStream } from 'fs';
import { getSupabaseClient } from './supabase.js';

interface AuditEvent {
  event_type: 'mcp_tool_call' | 'mcp_resource_read' | 'mcp_prompt_get';
  server: string;
  tool?: string;
  resource?: string;
  prompt?: string;
  arguments?: unknown;
  result?: {
    status: 'success' | 'error';
    data?: unknown;
    error?: string;
  };
  timestamp: string;
  user?: string;
  ip_address?: string;
  session_id?: string;
}

let auditLogStream: WriteStream | null = null;

function getAuditLogStream(): WriteStream {
  if (auditLogStream) {
    return auditLogStream;
  }

  const logPath = process.env.MCP_AUDIT_LOG_PATH || '/tmp/bidflow-mcp-audit.log';
  auditLogStream = createWriteStream(logPath, { flags: 'a' });

  return auditLogStream;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  // Write to file
  try {
    const stream = getAuditLogStream();
    stream.write(JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('[Audit] Failed to write to log file:', error);
  }

  // Write to database (async, non-blocking)
  try {
    const supabase = getSupabaseClient();
    await supabase.from('mcp_audit_logs').insert({
      event_type: logEntry.event_type,
      server: logEntry.server,
      tool: logEntry.tool,
      resource: logEntry.resource,
      arguments: logEntry.arguments as any,
      result: logEntry.result as any,
      timestamp: logEntry.timestamp,
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[Audit] Failed to write to database:', error);
  }
}
