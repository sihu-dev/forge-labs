{
    // forge-labs 워크스페이스 설정
      // Claude Chrome Extension 최적화
        
          // 에디터 설정
            "editor.fontSize": 14,
              "editor.tabSize": 2,
                "editor.wordWrap": "on",
                  "editor.formatOnSave": true,
                    "editor.formatOnPaste": true,
                      "editor.bracketPairColorization.enabled": true,
                        "editor.guides.bracketPairs": "active",
                          
                            // 파일 탐색기 설정
                              "explorer.compactFolders": false,
                                "explorer.fileNesting.enabled": true,
                                  "explorer.fileNesting.patterns": {
                                        "*.ts": "${capture}.js, ${capture}.d.ts, ${capture}.test.ts, ${capture}.spec.ts",
                                            "*.tsx": "${capture}.test.tsx, ${capture}.spec.tsx",
                                                "package.json": "package-lock.json, yarn.lock, pnpm-lock.yaml, .npmrc, tsconfig*.json"
                                  },
                                    
                                      // TypeScript/JavaScript
                                        "[typescript]": {
                                              "editor.defaultFormatter": "esbenp.prettier-vscode",
                                                  "editor.codeActionsOnSave": {
                                                          "source.organizeImports": "explicit"
                                                  }
                                        },
                                          "[typescriptreact]": {
                                                "editor.defaultFormatter": "esbenp.prettier-vscode"
                                          },
                                            "[javascript]": {
                                                  "editor.defaultFormatter": "esbenp.prettier-vscode"
                                            },
                                              "[json]": {
                                                    "editor.defaultFormatter": "esbenp.prettier-vscode"
                                              },
                                                "[jsonc]": {
                                                      "editor.defaultFormatter": "esbenp.prettier-vscode"
                                                },
                                                  "[markdown]": {
                                                        "editor.wordWrap": "on",
                                                            "editor.quickSuggestions": {
                                                                    "other": "on",
                                                                          "comments": "off",
                                                                                "strings": "off"
                                                            }
                                                  },
                                                    
                                                      // 검색 제외
                                                        "search.exclude": {
                                                              "**/node_modules": true,
                                                                  "**/dist": true,
                                                                      "**/build": true,
                                                                          "**/.next": true,
                                                                              "**/coverage": true
                                                        },
                                                          
                                                            // 파일 제외
                                                              "files.exclude": {
                                                                    "**/.git": true,
                                                                        "**/.DS_Store": true,
                                                                            "**/Thumbs.db": true
                                                              },
                                                                
                                                                  // Git 설정
                                                                    "git.enableSmartCommit": true,
                                                                      "git.confirmSync": false,
                                                                        
                                                                          // 추천 확장
                                                                            "recommendations": [
                                                                                  "esbenp.prettier-vscode",
                                                                                      "dbaeumer.vscode-eslint",
                                                                                          "bradlc.vscode-tailwindcss",
                                                                                              "eamodio.gitlens",
                                                                                                  "pkief.material-icon-theme",
                                                                                                      "usernamehw.errorlens"
                                                                            ]
}
                                                                            ]
                                                              }
                                                        }
                                                            }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                                  }
                                        }
                                  }
}