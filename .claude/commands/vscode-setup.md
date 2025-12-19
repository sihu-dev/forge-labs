---
name: vscode-setup
description: VS Code 워크스페이스 설정 및 최적화 가이드
---

# VS Code 워크스페이스 최적화

## 권장 설정

### settings.json (워크스페이스)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 권장 확장

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## 디버그 구성

```json
{
  "configurations": [
    {
      "name": "HEPHAITOS",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "BIDFLOW",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3010"
    }
  ]
}
```

## 작업 (Tasks)

- `pnpm dev` - 개발 서버
- `pnpm build` - 프로덕션 빌드
- `pnpm typecheck` - 타입 체크
- `pnpm lint` - ESLint

---

VS Code 설정을 확인하고 필요시 위 설정을 적용하세요.
