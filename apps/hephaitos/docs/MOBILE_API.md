# Mobile Claude App API Documentation

Complete API reference for mobile Claude app integration with HEPHAITOS.

**Version**: 2.0
**Last Updated**: 2024-12-24
**Base URL**: `https://hephaitos.io/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Command Execution](#command-execution)
3. [Status & Monitoring](#status--monitoring)
4. [Korean Keyboard Shortcuts](#korean-keyboard-shortcuts)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

### Create Session

Create a new mobile session with optional pairing code.

**Endpoint**: `POST /api/mobile/auth/session`

**Request Body**:
```json
{
  "deviceId": "mobile-12345",
  "deviceName": "iPhone 14 Pro",
  "pairingCode": "123456",
  "metadata": {
    "userAgent": "Claude/1.0.0 (iOS 17.0)",
    "platform": "ios",
    "appVersion": "1.0.0"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "sessionId": "session_1234567890_abc123",
    "expiresAt": 1735123456789
  }
}
```

**Errors**:
- `400`: Invalid request or pairing code
- `500`: Internal server error

---

### Refresh Token

Refresh an existing session token before expiry.

**Endpoint**: `POST /api/mobile/auth/refresh`

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "newTokenHere...",
    "sessionId": "session_1234567890_abc123",
    "expiresAt": 1735209856789
  }
}
```

**Errors**:
- `401`: Invalid or expired token
- `500`: Internal server error

---

### Delete Session

Terminate a mobile session.

**Endpoint**: `DELETE /api/mobile/auth/session`

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Errors**:
- `401`: Invalid or expired token
- `500`: Internal server error

---

### Generate Pairing Code

Generate a 6-digit pairing code for QR code authentication.

**Endpoint**: `GET /api/mobile/auth/pairing?deviceId={deviceId}`

**Query Parameters**:
- `deviceId` (required): Unique device identifier

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "pairingCode": "123456",
    "expiresIn": 300,
    "deviceId": "mobile-12345"
  }
}
```

**Notes**:
- Pairing codes expire after 5 minutes
- Use this code when creating a session

---

## Command Execution

### Execute Command

Execute a remote command from mobile app.

**Endpoint**: `POST /api/claude/commands`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "command": "next",
  "params": {
    "count": 3
  }
}
```

**Available Commands**:

| Command | Description | Params |
|---------|-------------|--------|
| `status` | Get current status | - |
| `next` | Execute next task(s) | `count?: number` (default: 1) |
| `commit_push` | Commit & push changes | - |
| `code_review` | Run code review | - |
| `test` | Run tests | - |
| `deploy` | Deploy to production | - |
| `hephaitos` | Switch to HEPHAITOS | `submenu?: string` |
| `bidflow` | Switch to BIDFLOW | `submenu?: string` |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Queued 3 tasks for execution",
  "taskId": "task-1234567890-1",
  "status": "queued",
  "data": {
    "tasksQueued": 3,
    "estimatedTime": 45,
    "tasks": [
      {
        "id": "task-1",
        "title": "Priority task 1",
        "status": "queued"
      }
    ]
  }
}
```

**Errors**:
- `400`: Invalid command or parameters
- `401`: Unauthorized (invalid token)
- `500`: Command execution failed

---

### Get Task Status

Query the status of a running task.

**Endpoint**: `GET /api/claude/commands?taskId={taskId}`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `taskId` (required): Task ID from command execution

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "taskId": "task-1234567890-1",
    "command": "next",
    "params": { "count": 3 },
    "status": "executing",
    "result": null,
    "error": null,
    "createdAt": 1735123456789,
    "updatedAt": 1735123460000
  }
}
```

**Task Status Values**:
- `queued`: Task is waiting to execute
- `executing`: Task is currently running
- `completed`: Task finished successfully
- `failed`: Task encountered an error

---

## Status & Monitoring

### Get Mobile Status

Get lightweight status optimized for mobile apps.

**Endpoint**: `GET /api/mobile/status`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `project` (optional): `HEPHAITOS` | `BIDFLOW` (default: HEPHAITOS)

**Response** (200 OK):
```json
{
  "success": true,
  "cached": false,
  "mobile": true,
  "data": {
    "project": "HEPHAITOS",
    "mode": "development",
    "completion": 70,
    "currentTask": "Mobile app integration - Phase 2",
    "currentTaskProgress": 60,
    "nextTask": "WebSocket streaming endpoint",
    "nextTaskPriority": "P0",
    "connectionStatus": "connected",
    "lastActivity": "2024-12-24T10:30:00.000Z",
    "stats": {
      "todayCommits": 5,
      "tasksCompleted": 9,
      "tasksRemaining": 7,
      "uptime": 12345.67
    },
    "shortcuts": [
      {
        "key": "ㅅ (S)",
        "description": "Status check"
      }
    ]
  }
}
```

**Response Size**: < 2KB
**Cache TTL**: 5 seconds

---

## Korean Keyboard Shortcuts

### Shortcut Mapping

Korean Hangul shortcuts with English fallbacks:

| Korean | English | Command | Description |
|--------|---------|---------|-------------|
| ㅅ | S | `status` | Status check |
| ㅎ | H | `hephaitos` | HEPHAITOS mode (shows submenu) |
| ㅂ | B | `bidflow` | BIDFLOW mode (shows submenu) |
| ㄱ | G | `next` | Next task |
| ㄱㄱ | GG | `next` (count: 2) | 2 sequential tasks |
| ㄱㄱㄱ | GGG | `next` (count: 3) | 3 sequential tasks |
| ㅋ | K | `commit_push` | Commit & push |
| ㅊ | C | `code_review` | Code review |
| ㅌ | T | `test` | Run tests |
| ㅍ | P | `deploy` | Deploy |

### Submenu Options

**HEPHAITOS (ㅎ)**:
- `빌더` → Strategy Builder
- `백테스트` → Backtest Engine
- `거래소` → Exchange Integration
- `멘토` → Mentor/Mentee System

**BIDFLOW (ㅂ)**:
- `리드` → Lead Management
- `캠페인` → Campaign Management
- `워크플로우` → n8n Workflows
- `입찰` → Bid Crawling

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error message here",
  "details": {
    "fieldErrors": {},
    "formErrors": []
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

---

## Rate Limiting

**Command Execution**:
- Limit: 60 requests per minute per session
- Header: `X-RateLimit-Remaining`

**Status Endpoint**:
- Limit: 120 requests per minute per session
- Cached responses don't count toward limit

**Authentication**:
- Limit: 10 requests per minute per device

---

## Examples

### Complete Authentication Flow

```typescript
// 1. Get pairing code
const pairingRes = await fetch(
  'https://hephaitos.io/api/mobile/auth/pairing?deviceId=mobile-12345'
);
const { data: { pairingCode } } = await pairingRes.json();

// 2. Show QR code or input field with pairingCode

// 3. Create session with pairing code
const sessionRes = await fetch('https://hephaitos.io/api/mobile/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceId: 'mobile-12345',
    deviceName: 'iPhone 14 Pro',
    pairingCode: pairingCode,
    metadata: {
      userAgent: navigator.userAgent,
      platform: 'ios',
      appVersion: '1.0.0',
    },
  }),
});

const { data: { token } } = await sessionRes.json();

// 4. Store token securely
localStorage.setItem('claudeToken', token);
```

### Execute Command

```typescript
// Execute 3 sequential tasks
const response = await fetch('https://hephaitos.io/api/claude/commands', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    command: 'next',
    params: { count: 3 },
  }),
});

const { taskId, message } = await response.json();
console.log(message); // "Queued 3 tasks for execution"

// Poll for task status
const checkStatus = async () => {
  const statusRes = await fetch(
    `https://hephaitos.io/api/claude/commands?taskId=${taskId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  const { data } = await statusRes.json();

  if (data.status === 'completed') {
    console.log('Tasks completed!', data.result);
  } else if (data.status === 'failed') {
    console.error('Tasks failed:', data.error);
  } else {
    setTimeout(checkStatus, 1000); // Poll every second
  }
};

checkStatus();
```

### Get Current Status

```typescript
// Get HEPHAITOS status
const statusRes = await fetch(
  'https://hephaitos.io/api/mobile/status?project=HEPHAITOS',
  {
    headers: { 'Authorization': `Bearer ${token}` },
  }
);

const { data: status } = await statusRes.json();

console.log(`${status.project}: ${status.completion}% complete`);
console.log(`Current task: ${status.currentTask}`);
console.log(`Next task: ${status.nextTask}`);
console.log(`Today's commits: ${status.stats.todayCommits}`);
```

---

## WebSocket Streaming (Coming Soon)

Real-time task progress updates via WebSocket.

**Endpoint**: `wss://hephaitos.io/api/claude/commands/stream/{taskId}`

**Example**:
```typescript
const ws = new WebSocket(
  `wss://hephaitos.io/api/claude/commands/stream/${taskId}?token=${token}`
);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Progress:', update.progress); // 0-100
  console.log('Message:', update.message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Task completed or connection closed');
};
```

---

## Support

- **Documentation**: https://docs.hephaitos.io
- **Issues**: https://github.com/sihu-dev/forge-labs/issues
- **Email**: support@hephaitos.io

---

*HEPHAITOS Mobile API v2.0*
*Last updated: 2024-12-24*
