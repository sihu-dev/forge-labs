module.exports = {
  extends: [
    'next/core-web-vitals',
    './index.js',
  ],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
