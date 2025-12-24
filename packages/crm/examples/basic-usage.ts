/**
 * @forge/crm - Basic Usage Example
 */

import { CRMFactory, createAttioCRM } from '@forge/crm';

async function main() {
  // 방법 1: Factory 패턴
  const crm = CRMFactory.create({
    provider: 'attio',
    apiKey: process.env.ATTIO_API_KEY || 'your_api_key'
  });

  // 방법 2: 환경변수에서 로드
  // const crm = CRMFactory.createFromEnv('attio');

  // 방법 3: 편의 함수
  // const crm = createAttioCRM(process.env.ATTIO_API_KEY!);

  // 초기화
  await crm.initialize();

  // 연결 테스트
  const connected = await crm.testConnection();
  console.log('✅ Connected:', connected);

  // === 리드 관리 ===
  console.log('\n📋 리드 관리');

  // 리드 생성
  const leadResult = await crm.leads.create({
    email: 'john.doe@acme.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'ACME Corp',
    jobTitle: 'CTO',
    source: 'website',
    tags: ['enterprise', 'hot-lead']
  });

  if (leadResult.success && leadResult.data) {
    console.log('  ✅ Lead created:', leadResult.data.id);

    // 리드 점수 업데이트
    await crm.leads.updateScore(leadResult.data.id, 85);
    console.log('  ✅ Score updated');

    // 리드 상태 변경
    await crm.leads.updateStatus(leadResult.data.id, 'qualified');
    console.log('  ✅ Status updated to qualified');

    // 리드를 딜로 전환
    const conversionResult = await crm.leads.convertToDeal(leadResult.data.id, {
      title: 'HEPHAITOS Enterprise Deal',
      value: 10000000
    });

    if (conversionResult.success && conversionResult.data) {
      console.log('  ✅ Converted to deal:', conversionResult.data.dealId);
    }
  }

  // === 딜 관리 ===
  console.log('\n💰 딜 관리');

  // 딜 생성
  const dealResult = await crm.deals.create({
    title: 'DRYON Smart Factory',
    description: 'AI-powered climate optimization for manufacturing',
    stage: 'proposal',
    priority: 'high',
    value: 50000000,
    currency: 'KRW',
    probability: 70,
    expectedCloseDate: '2025-06-30',
    tags: ['enterprise', 'manufacturing']
  });

  if (dealResult.success && dealResult.data) {
    console.log('  ✅ Deal created:', dealResult.data.id);

    // 딜 스테이지 변경
    await crm.deals.updateStage(dealResult.data.id, 'negotiation');
    console.log('  ✅ Stage updated to negotiation');

    // 딜 성공 처리
    await crm.deals.markAsWon(dealResult.data.id);
    console.log('  ✅ Deal marked as won');
  }

  // 딜 통계 조회
  const statsResult = await crm.deals.getStats({
    stage: ['closed_won']
  });

  if (statsResult.success && statsResult.data) {
    console.log('  📊 Win Rate:', statsResult.data.winRate.toFixed(2), '%');
    console.log('  📊 Total Value:', statsResult.data.totalValue.toLocaleString(), 'KRW');
    console.log('  📊 Avg Days to Close:', statsResult.data.avgDaysToClose.toFixed(0), 'days');
  }

  // === 회사 관리 ===
  console.log('\n🏢 회사 관리');

  // 회사 생성
  const companyResult = await crm.companies.create({
    name: 'ACME Corporation',
    domain: 'acme.com',
    industry: 'technology',
    size: 'medium',
    website: 'https://acme.com',
    employeeCount: 150,
    annualRevenue: 5000000000,
    currency: 'KRW',
    tags: ['enterprise', 'technology']
  });

  if (companyResult.success && companyResult.data) {
    console.log('  ✅ Company created:', companyResult.data.id);

    // 회사 정보 자동 채우기
    const enrichResult = await crm.companies.enrichByDomain('acme.com');
    if (enrichResult.success && enrichResult.data) {
      console.log('  ✅ Company enriched with additional data');
    }

    // 회사의 딜 목록 조회
    const dealsResult = await crm.companies.getDeals(companyResult.data.id);
    if (dealsResult.success && dealsResult.data) {
      console.log('  📋 Company has', dealsResult.data.length, 'deals');
    }
  }

  // === 리드 목록 조회 (필터링) ===
  console.log('\n🔍 리드 검색');

  const listResult = await crm.leads.list(
    {
      status: ['qualified', 'nurturing'],
      source: ['website'],
      scoreMin: 70,
      tags: ['enterprise']
    },
    {
      limit: 10,
      offset: 0
    }
  );

  if (listResult.success && listResult.data) {
    console.log('  📋 Found', listResult.data.items.length, 'qualified leads');
    console.log('  📋 Total:', listResult.data.total);
    console.log('  📋 Has more:', listResult.data.hasMore);
  }

  // 정리
  await crm.dispose();
  console.log('\n✅ Done!');
}

// 실행
main().catch(console.error);
