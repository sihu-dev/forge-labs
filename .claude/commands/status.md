# FORGE LABS 상태 확인
# 사용법: /project:status

## 현재 구현 상태 조회

다음을 확인하고 보고합니다:

1. **앱별 에이전트 현황**
   ```
   HEPHAITOS: portfolio-sync, backtest, order-executor + ?
   FOLIO: competitor-monitor, sales-forecast, inventory-optimizer + ?
   DRYON: sensor-optimizer, alarm-manager, energy-monitor + ?
   ```

2. **완료된 쿼리**
   - QRY-001 ~ QRY-009 (완료)
   - QRY-010 ~ ? (미구현)

3. **다음 작업**
   - 다음 쿼리 후보 목록
   - 권장 순서

## 출력 형식

```markdown
## 📊 FORGE LABS 상태 보고서

### 구현 현황
| App | Agents | 완료 | 다음 |
|-----|--------|------|------|
| HEPHAITOS | 3 | QRY-001,004,007 | QRY-010 |
| FOLIO | 3 | QRY-002,005,008 | QRY-011 |
| DRYON | 3 | QRY-003,006,009 | QRY-012 |

### 전체 진행률
- 완료: 9/15 쿼리 (60%)
- 남은 쿼리: 6개

### 다음 액션
`ㄱ` 입력 시 QRY-010 (HEPHAITOS Risk Manager) 시작
```
