/**
 * @forge/crm - Sync & Webhook Example (Attio Only)
 */

import { AttioProvider } from '@forge/crm';
import type { IWebhookEvent } from '@forge/crm';

async function main() {
  // Attio 프로바이더 직접 사용 (동기화 기능 필요 시)
  const attio = new AttioProvider({
    provider: 'attio',
    apiKey: process.env.ATTIO_API_KEY || 'your_api_key'
  });

  await attio.initialize();

  // === 전체 데이터 동기화 ===
  console.log('📥 Starting full sync...');

  const syncResult = await attio.sync.syncAll(['leads', 'deals', 'companies']);

  if (syncResult.success && syncResult.data) {
    console.log('\n✅ Sync completed');
    console.log('  📊 Total records:', syncResult.data.totalRecords);
    console.log('  ✅ Synced:', syncResult.data.syncedRecords);
    console.log('  ❌ Failed:', syncResult.data.failedRecords);
    console.log('  ⏱️  Duration:',
      new Date(syncResult.data.completedAt!).getTime() - new Date(syncResult.data.startedAt).getTime(),
      'ms'
    );

    if (syncResult.data.errors && syncResult.data.errors.length > 0) {
      console.log('\n❌ Errors:');
      syncResult.data.errors.forEach(error => {
        console.log(`  - Record ${error.recordId}: ${error.error}`);
      });
    }
  }

  // === 웹훅 설정 ===
  console.log('\n🔗 Setting up webhooks...');

  const webhookResult = await attio.sync.setupWebhook(
    'https://your-app.com/webhooks/attio',
    [
      'record.created',
      'record.updated',
      'record.deleted',
      'list.updated'
    ]
  );

  if (webhookResult.success && webhookResult.data) {
    console.log('✅ Webhook configured:', webhookResult.data.webhookId);
  }

  // === 웹훅 이벤트 처리 예시 ===
  console.log('\n📨 Webhook event handling example:');

  // 실제로는 Express 등의 웹 서버에서 받음
  const mockWebhookEvent: IWebhookEvent = {
    id: 'evt_123',
    type: 'record.created',
    objectType: 'leads',
    recordId: 'lead_456',
    timestamp: new Date().toISOString(),
    data: {
      email: 'jane@example.com',
      status: 'new'
    }
  };

  try {
    await attio.sync.handleWebhookEvent(mockWebhookEvent);
    console.log('✅ Webhook event processed');
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
  }

  // === 동기화 상태 확인 ===
  const syncStatus = attio.sync.getSyncStatus();
  console.log('\n📊 Current sync status:', syncStatus);

  // 정리
  await attio.dispose();
  console.log('\n✅ Done!');
}

// Express 웹훅 엔드포인트 예시
/*
import express from 'express';

const app = express();
app.use(express.json());

const attio = new AttioProvider({
  provider: 'attio',
  apiKey: process.env.ATTIO_API_KEY!
});

await attio.initialize();

app.post('/webhooks/attio', async (req, res) => {
  try {
    const event: IWebhookEvent = req.body;

    // 웹훅 이벤트 처리
    await attio.sync.handleWebhookEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
*/

// 실행
main().catch(console.error);
