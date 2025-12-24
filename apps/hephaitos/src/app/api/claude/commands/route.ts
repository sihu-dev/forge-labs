/**
 * Claude Commands API
 * Remote command execution endpoint for mobile Claude app
 *
 * POST /api/claude/commands
 * Body: { command: CommandType, params?: CommandParams }
 * Returns: CommandResult
 *
 * GET /api/claude/commands/:taskId
 * Returns: Task status
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeCommand, getTaskStatus, cleanupOldTasks, type CommandType, type CommandParams } from '@/lib/mobile/command-executor';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const CommandSchema = z.object({
  command: z.enum([
    'status',
    'next',
    'commit_push',
    'code_review',
    'test',
    'deploy',
    'hephaitos',
    'bidflow',
  ]),
  params: z
    .object({
      count: z.number().int().min(1).max(10).optional(),
      submenu: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

// ============================================
// POST /api/claude/commands
// Execute a command
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = CommandSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { command, params = {} } = validationResult.data;

    // Execute command
    const result = await executeCommand(command as CommandType, params as CommandParams);

    // Clean up old tasks periodically
    if (Math.random() < 0.1) {
      // 10% chance on each request
      cleanupOldTasks();
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('[Claude Commands API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/claude/commands?taskId=xxx
// Get task status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing taskId parameter',
        },
        { status: 400 }
      );
    }

    const taskStatus = getTaskStatus(taskId);

    if (!taskStatus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: taskStatus,
    });
  } catch (error) {
    console.error('[Claude Commands API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS - CORS preflight
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
