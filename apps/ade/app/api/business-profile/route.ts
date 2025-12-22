/**
 * 사업자 프로필 API - 조회 및 수정
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/business-profile - 사업자 프로필 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error } = await (supabase as any)
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      console.error('Business profile fetch error:', error);
      return NextResponse.json({ error: '사업자 정보를 불러오지 못했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Business profile API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT /api/business-profile - 사업자 프로필 생성/수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.name || !body.businessNumber || !body.email) {
      return NextResponse.json(
        { error: '상호명, 사업자등록번호, 이메일은 필수입니다' },
        { status: 400 }
      );
    }

    // 사업자등록번호 형식 검증 (XXX-XX-XXXXX)
    const bizNumRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!bizNumRegex.test(body.businessNumber)) {
      return NextResponse.json(
        { error: '사업자등록번호 형식이 올바르지 않습니다 (예: 123-45-67890)' },
        { status: 400 }
      );
    }

    // 기존 프로필 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const profileData = {
      user_id: user.id,
      name: body.name,
      business_number: body.businessNumber,
      representative_name: body.representativeName || null,
      address: body.address || null,
      business_type: body.businessType || null,
      business_category: body.businessCategory || null,
      email: body.email,
      phone: body.phone || null,
      bank_name: body.bankName || null,
      account_number: body.accountNumber || null,
      account_holder: body.accountHolder || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // 업데이트
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (supabase as any)
        .from('business_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // 새로 생성
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (supabase as any)
        .from('business_profiles')
        .insert({ ...profileData, created_at: new Date().toISOString() })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Business profile save error:', result.error);
      return NextResponse.json({ error: '사업자 정보 저장에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      profile: result.data,
      message: existing ? '사업자 정보가 수정되었습니다' : '사업자 정보가 등록되었습니다',
    });
  } catch (error) {
    console.error('Business profile save API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
