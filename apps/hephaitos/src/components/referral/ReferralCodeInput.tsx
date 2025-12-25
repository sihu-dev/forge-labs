/**
 * Referral Code Input Component
 * 추천 코드 입력 컴포넌트 (회원가입 시 사용)
 */

'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ReferralCodeInputProps {
  onValidCode?: (code: string) => void;
  onInvalidCode?: () => void;
  className?: string;
}

export function ReferralCodeInput({
  onValidCode,
  onInvalidCode,
  className = '',
}: ReferralCodeInputProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [message, setMessage] = useState('');

  const validateCode = async (inputCode: string) => {
    if (!inputCode || inputCode.length < 6) {
      setStatus('idle');
      setMessage('');
      return;
    }

    setStatus('checking');

    try {
      const response = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setStatus('valid');
        setMessage(`${data.referrerName}님의 추천 코드입니다. 가입 시 ${data.reward}크레딧을 받습니다!`);
        onValidCode?.(inputCode);
      } else {
        setStatus('invalid');
        setMessage(data.message || '유효하지 않은 추천 코드입니다');
        onInvalidCode?.();
      }
    } catch {
      setStatus('invalid');
      setMessage('코드 확인 중 오류가 발생했습니다');
      onInvalidCode?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);

    // 8자 이상이면 자동 검증
    if (value.length >= 8) {
      validateCode(value);
    } else {
      setStatus('idle');
      setMessage('');
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs text-zinc-400 mb-1.5">
        추천 코드 (선택)
      </label>
      <div className="relative">
        <input
          type="text"
          value={code}
          onChange={handleChange}
          maxLength={8}
          placeholder="추천 코드 입력"
          className={`w-full h-11 px-3 pr-10 bg-white/[0.04] border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-all ${
            status === 'valid'
              ? 'border-emerald-500/50 focus:border-emerald-500/70'
              : status === 'invalid'
              ? 'border-red-500/50 focus:border-red-500/70'
              : 'border-white/[0.06] focus:border-[#5E6AD2]/50'
          }`}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === 'checking' && (
            <div className="w-5 h-5 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'valid' && (
            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
          )}
          {status === 'invalid' && (
            <XCircleIcon className="w-5 h-5 text-red-400" />
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className={`mt-1.5 text-xs ${
          status === 'valid' ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
