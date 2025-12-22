/**
 * ADE - 랜딩페이지 템플릿
 * 서비스 소개 페이지
 */

import type { LandingData, Theme } from '../types';

interface LandingTemplateProps {
  data: LandingData;
  theme: Theme;
}

export function LandingTemplate({ data, theme }: LandingTemplateProps) {
  const {
    businessName,
    tagline,
    description,
    logo,
    heroImage,
    services,
    features,
    testimonials,
    pricing,
    cta,
    contact,
  } = data;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt={businessName} className="h-8 w-auto" />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: theme.primaryColor }}
              >
                {businessName}
              </span>
            )}
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {services && <a href="#services" className="text-gray-600 hover:text-gray-900">서비스</a>}
            {features && <a href="#features" className="text-gray-600 hover:text-gray-900">특징</a>}
            {pricing && <a href="#pricing" className="text-gray-600 hover:text-gray-900">가격</a>}
            {contact && <a href="#contact" className="text-gray-600 hover:text-gray-900">문의</a>}
          </div>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: theme.primaryColor }}
          >
            시작하기
          </button>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section
        className="pt-32 pb-20 px-4"
        style={{
          background: heroImage
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroImage}) center/cover`
            : `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor || theme.primaryColor}10)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className={`text-4xl md:text-6xl font-bold leading-tight ${
              heroImage ? 'text-white' : ''
            }`}
            style={{ color: heroImage ? undefined : theme.textColor }}
          >
            {tagline}
          </h1>
          {description && (
            <p
              className={`text-xl mt-6 max-w-2xl mx-auto ${
                heroImage ? 'text-white/90' : 'text-gray-600'
              }`}
            >
              {description}
            </p>
          )}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-8 py-4 rounded-lg text-lg font-medium text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: theme.primaryColor }}
            >
              무료로 시작하기
            </button>
            <button
              className={`px-8 py-4 rounded-lg text-lg font-medium border-2 transition-transform hover:scale-105 ${
                heroImage ? 'text-white border-white' : ''
              }`}
              style={{
                borderColor: heroImage ? undefined : theme.primaryColor,
                color: heroImage ? undefined : theme.primaryColor,
              }}
            >
              자세히 보기
            </button>
          </div>
        </div>
      </section>

      {/* 서비스 섹션 */}
      {services && services.length > 0 && (
        <section id="services" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-4"
              style={{ color: theme.textColor }}
            >
              서비스
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              다양한 서비스를 제공합니다
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  {service.icon && (
                    <div className="text-4xl mb-4">{service.icon}</div>
                  )}
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: theme.textColor }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                  {service.price && (
                    <p
                      className="mt-4 font-semibold"
                      style={{ color: theme.primaryColor }}
                    >
                      {service.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 특징 섹션 */}
      {features && features.length > 0 && (
        <section
          id="features"
          className="py-20 px-4"
          style={{ backgroundColor: `${theme.primaryColor}05` }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ color: theme.textColor }}
            >
              왜 {businessName}인가요?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex gap-4 p-6 rounded-xl bg-white"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    {feature.icon || '✓'}
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: theme.textColor }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 후기 섹션 */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ color: theme.textColor }}
            >
              고객 후기
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="p-6 rounded-2xl bg-white shadow-lg"
                >
                  {testimonial.rating && (
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < testimonial.rating! ? 'text-yellow-400' : 'text-gray-200'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-600 italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-6">
                    {testimonial.photo ? (
                      <img
                        src={testimonial.photo}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold" style={{ color: theme.textColor }}>
                        {testimonial.name}
                      </p>
                      {(testimonial.title || testimonial.company) && (
                        <p className="text-sm text-gray-500">
                          {testimonial.title}
                          {testimonial.title && testimonial.company && ', '}
                          {testimonial.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 가격 섹션 */}
      {pricing && pricing.length > 0 && (
        <section
          id="pricing"
          className="py-20 px-4"
          style={{ backgroundColor: `${theme.primaryColor}05` }}
        >
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl font-bold text-center mb-4"
              style={{ color: theme.textColor }}
            >
              가격 안내
            </h2>
            <p className="text-center text-gray-600 mb-12">
              합리적인 가격으로 시작하세요
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricing.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-8 rounded-2xl ${
                    plan.highlighted
                      ? 'bg-white shadow-2xl scale-105 border-2'
                      : 'bg-white shadow-lg'
                  }`}
                  style={{
                    borderColor: plan.highlighted ? theme.primaryColor : undefined,
                  }}
                >
                  {plan.highlighted && (
                    <div
                      className="text-xs font-bold uppercase tracking-wider text-center mb-4 -mt-4 py-1 rounded-full"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: 'white',
                      }}
                    >
                      인기
                    </div>
                  )}
                  <h3
                    className="text-xl font-semibold text-center"
                    style={{ color: theme.textColor }}
                  >
                    {plan.name}
                  </h3>
                  <div className="text-center mt-4">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: theme.primaryColor }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-500">/{plan.period}</span>
                    )}
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <span style={{ color: theme.primaryColor }}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full mt-8 py-3 rounded-lg font-medium transition-transform hover:scale-105 ${
                      plan.highlighted ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: plan.highlighted
                        ? theme.primaryColor
                        : `${theme.primaryColor}15`,
                      color: plan.highlighted ? undefined : theme.primaryColor,
                    }}
                  >
                    {plan.ctaText || '시작하기'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA 섹션 */}
      {cta && (
        <section
          className="py-20 px-4"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || theme.primaryColor})`,
          }}
        >
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold">{cta.title}</h2>
            {cta.description && (
              <p className="mt-4 text-xl opacity-90">{cta.description}</p>
            )}
            <button
              className="mt-8 px-8 py-4 bg-white rounded-lg text-lg font-medium transition-transform hover:scale-105"
              style={{ color: theme.primaryColor }}
            >
              {cta.buttonText}
            </button>
          </div>
        </section>
      )}

      {/* 연락처 섹션 */}
      {contact && (
        <section id="contact" className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="text-3xl font-bold mb-8"
              style={{ color: theme.textColor }}
            >
              문의하기
            </h2>
            <div className="space-y-4 text-gray-600">
              {contact.email && (
                <p>
                  이메일:{' '}
                  <a
                    href={`mailto:${contact.email}`}
                    style={{ color: theme.primaryColor }}
                  >
                    {contact.email}
                  </a>
                </p>
              )}
              {contact.phone && (
                <p>
                  전화:{' '}
                  <a
                    href={`tel:${contact.phone}`}
                    style={{ color: theme.primaryColor }}
                  >
                    {contact.phone}
                  </a>
                </p>
              )}
              {contact.address && <p>주소: {contact.address}</p>}
            </div>

            {contact.formEnabled && (
              <form className="mt-12 space-y-4 text-left">
                <input
                  type="text"
                  placeholder="이름"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                />
                <input
                  type="email"
                  placeholder="이메일"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
                />
                <textarea
                  placeholder="메시지"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-medium text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  보내기
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <p className="mt-1 opacity-60">Made with ADE</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingTemplate;
