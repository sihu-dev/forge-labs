/**
 * ADE - 디지털 명함 템플릿
 * 명함 사진 OCR → 디지털 명함 페이지
 */

import type { CardData, Theme } from '../types';

interface CardTemplateProps {
  data: CardData;
  theme: Theme;
}

export function CardTemplate({ data, theme }: CardTemplateProps) {
  const {
    name,
    title,
    company,
    email,
    phone,
    website,
    address,
    photo,
    logo,
    socials,
  } = data;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: theme.backgroundColor,
          borderRadius: theme.borderRadius === 'full' ? '24px' :
                       theme.borderRadius === 'lg' ? '16px' :
                       theme.borderRadius === 'md' ? '12px' :
                       theme.borderRadius === 'sm' ? '8px' : '0',
        }}
      >
        {/* 헤더 배경 */}
        <div
          className="h-32 relative"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || theme.primaryColor})`,
          }}
        >
          {logo && (
            <img
              src={logo}
              alt="Logo"
              className="absolute top-4 right-4 h-8 w-auto opacity-80"
            />
          )}
        </div>

        {/* 프로필 사진 */}
        <div className="relative -mt-16 flex justify-center">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
          ) : (
            <div
              className="w-32 h-32 rounded-full border-4 border-white flex items-center justify-center text-4xl font-bold shadow-lg"
              style={{
                backgroundColor: theme.primaryColor,
                color: '#FFFFFF',
              }}
            >
              {name?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="px-6 py-8 text-center">
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.textColor }}
          >
            {name}
          </h1>

          {title && (
            <p
              className="text-lg mt-1"
              style={{ color: theme.primaryColor }}
            >
              {title}
            </p>
          )}

          {company && (
            <p
              className="text-sm mt-1 opacity-70"
              style={{ color: theme.textColor }}
            >
              {company}
            </p>
          )}

          {/* 연락처 */}
          <div className="mt-6 space-y-3">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center justify-center gap-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <EmailIcon color={theme.primaryColor} />
                {email}
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <PhoneIcon color={theme.primaryColor} />
                {phone}
              </a>
            )}

            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <WebIcon color={theme.primaryColor} />
                {website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {address && (
              <p
                className="flex items-center justify-center gap-2 text-sm opacity-70"
                style={{ color: theme.textColor }}
              >
                <LocationIcon color={theme.primaryColor} />
                {address}
              </p>
            )}
          </div>

          {/* 소셜 링크 */}
          {socials && socials.length > 0 && (
            <div className="mt-6 flex justify-center gap-4">
              {socials.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <SocialIcon platform={social.platform} color={theme.primaryColor} />
                </a>
              ))}
            </div>
          )}

          {/* 연락처 저장 버튼 */}
          <button
            className="mt-8 w-full py-3 rounded-lg font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: theme.primaryColor }}
            onClick={() => {
              // vCard 다운로드 로직
              const vcard = generateVCard(data);
              downloadVCard(vcard, name);
            }}
          >
            연락처 저장
          </button>
        </div>
      </div>
    </div>
  );
}

// vCard 생성
function generateVCard(data: CardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name || ''}`,
    data.company ? `ORG:${data.company}` : '',
    data.title ? `TITLE:${data.title}` : '',
    data.email ? `EMAIL:${data.email}` : '',
    data.phone ? `TEL:${data.phone}` : '',
    data.website ? `URL:${data.website}` : '',
    data.address ? `ADR:;;${data.address};;;;` : '',
    'END:VCARD',
  ].filter(Boolean);

  return lines.join('\n');
}

// vCard 다운로드
function downloadVCard(vcard: string, name: string) {
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'contact'}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

// 아이콘 컴포넌트들
function EmailIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill={color} viewBox="0 0 20 20">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill={color} viewBox="0 0 20 20">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  );
}

function WebIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill={color} viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
    </svg>
  );
}

function LocationIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" fill={color} viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

function SocialIcon({ platform, color }: { platform: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    linkedin: (
      <svg className="w-5 h-5" fill={color} viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" fill={color} viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill={color} viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" fill={color} viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  };

  return icons[platform] || icons.linkedin;
}

export default CardTemplate;
