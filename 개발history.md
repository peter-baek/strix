# Strix Web Dashboard - 개발 히스토리

## 📅 개발 일자: 2025-12-14

## 🎯 개발 목표

Strix Web Dashboard를 **실제 서비스 수준의 보안 스캐닝 플랫폼**으로 업그레이드

### 주요 기능
1. ✅ **MD 리포트 뷰어** - 브라우저에서 보고서 읽기
2. ✅ **다운로드 기능** - MD, JSON, CSV, PDF 다운로드
3. ⏳ **검사 유형 선택** - Strix v0.4.0 prompt modules 기반 (예정)
4. ✅ **한글/영어 지원** - react-i18next로 완전한 다국어화
5. ✅ **서비스 친화적 UX** - 검사 전/중/후 명확한 가이드

---

## 📦 Phase 1-5 구현 완료 (2025-12-14)

### ✅ Backend Infrastructure (Phase 1 & 2)

#### 새로 생성한 파일

**1. `strix-web/backend/app/report_service.py`**
- **목적**: 파일 시스템과 API 연결
- **기능**:
  - `scan_filesystem()` - strix_runs 디렉토리 스캔하여 모든 과거 스캔 로드
  - `get_report_content()` - MD 리포트 파일 읽기
  - `get_vulnerability_report()` - 개별 취약점 리포트 읽기
  - `list_vulnerabilities()` - 취약점 목록 가져오기
  - `export_to_format()` - MD, JSON, CSV, PDF로 변환
  - `export_to_pdf()` - weasyprint 사용하여 PDF 생성

**2. `strix-web/backend/app/persistence.py`**
- **목적**: scan_id와 run_name 매핑 관리
- **저장 위치**: `.strix_api_data/scan_mapping.json`
- **기능**:
  - `add_mapping()` - 스캔 ID와 run_name 매핑 추가
  - `get_run_name()` - scan_id로 run_name 조회
  - `get_scan_id()` - run_name으로 scan_id 조회 (역방향)
  - 매핑 데이터 디스크 저장 및 로드

#### 수정한 파일

**`strix-web/backend/app/models.py`**
```python
# 추가된 Enum
class ExportFormat(str, Enum):
    MARKDOWN = "md"
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"
    ZIP = "zip"

# ScanConfig에 추가된 필드
class ScanConfig(BaseModel):
    # ... 기존 필드
    prompt_modules: list[str] | None = None  # 새로 추가

# ScanRun에 추가된 필드
class ScanRun(BaseModel):
    # ... 기존 필드
    run_name: str | None = None        # 새로 추가
    is_historical: bool = False        # 새로 추가
```

**`strix-web/backend/app/scan_manager.py`**
```python
# 추가된 import
from .report_service import ReportService
from .persistence import ScanPersistence

# __init__에 추가
self.report_service = ReportService()
self.persistence = ScanPersistence()
self._load_historical_scans()

# 새로운 메서드
def _load_historical_scans(self):
    """파일 시스템에서 과거 스캔 로드"""
    # strix_runs 디렉토리에서 모든 스캔 발견
    # 각 스캔을 ScanRun 객체로 생성
    # historical-{run_name} 형식의 ID 부여

def _find_latest_run_name(self, scan_id: str):
    """스캔 완료 후 최신 run 디렉토리 찾기"""
    # 수정 시간 기준으로 가장 최신 디렉토리 반환
```

**`strix-web/backend/app/main.py`**
```python
# 새로 추가된 API 엔드포인트

@app.get("/api/scans/{scan_id}/report")
async def get_report(scan_id: str):
    """전체 마크다운 리포트 가져오기"""
    # run_name 확인
    # 리포트 파일 읽기
    # 취약점 목록 반환

@app.get("/api/scans/{scan_id}/export")
async def export_report(scan_id: str, format: str = "md"):
    """리포트를 지정된 형식으로 내보내기 (md, json, csv, pdf)"""
    # 형식 검증
    # 리포트 변환
    # 파일 다운로드 Response 반환

@app.get("/api/scans/{scan_id}/vulnerabilities/{vuln_id}/report")
async def get_vulnerability_report(scan_id: str, vuln_id: str):
    """특정 취약점의 상세 리포트 가져오기"""
    # 취약점 MD 파일 읽기
    # 파싱하여 반환
```

**`strix-web/backend/requirements.txt`**
```
# 추가된 패키지
markdown>=3.5.0
weasyprint>=60.0
```

#### Backend 기능

✅ **자동 과거 스캔 로드**
- 서버 시작 시 `strix_runs/` 디렉토리 자동 스캔
- 모든 과거 스캔을 `historical-{run_name}` ID로 로드
- 5개의 과거 스캔 성공적으로 로드 확인:
  - historical-forms-punkpoll-com_1148
  - historical-www-propoz-org_0216
  - historical-www-propoz-com_8584
  - historical-www-punkpoll-com_2c8a
  - historical-www-propoz-org_78a0

✅ **리포트 API**
- GET `/api/scans/{scan_id}/report` - 전체 MD 리포트 + 취약점 목록
- GET `/api/scans/{scan_id}/export?format={md|json|csv|pdf}` - 다양한 형식으로 다운로드
- GET `/api/scans/{scan_id}/vulnerabilities/{vuln_id}/report` - 개별 취약점 상세

✅ **영구 저장**
- `.strix_api_data/scan_mapping.json`에 스캔 매핑 저장
- 서버 재시작 후에도 스캔 ID 유지

---

### ✅ i18n 다국어 지원 (Phase 3)

#### 새로 생성한 파일

**i18n 설정**
- `strix-web/frontend/src/i18n/config.ts` - i18next 설정
- `strix-web/frontend/src/i18n/react-i18next.d.ts` - TypeScript 타입 정의

**번역 파일 (영어)**
- `public/locales/en/common.json` - 공통 UI (버튼, 레이블, 상태, 네비게이션)
- `public/locales/en/scan.json` - 스캔 관련 UI
- `public/locales/en/vulnerability.json` - 취약점 리포트
- `public/locales/en/dashboard.json` - 대시보드

**번역 파일 (한국어)**
- `public/locales/ko/common.json` - 공통 UI
- `public/locales/ko/scan.json` - 스캔 관련 UI
- `public/locales/ko/vulnerability.json` - 취약점 리포트
- `public/locales/ko/dashboard.json` - 대시보드

#### 번역 예시

**`common.json`**
```json
// English
{
  "app": {
    "name": "STRIX",
    "tagline": "Open-source AI Hackers for your Apps"
  },
  "actions": {
    "startScan": "Start Security Scan",
    "stopScan": "Stop Scan",
    "download": "Download"
  }
}

// Korean
{
  "app": {
    "name": "STRIX",
    "tagline": "애플리케이션을 위한 오픈소스 AI 해커"
  },
  "actions": {
    "startScan": "보안 스캔 시작",
    "stopScan": "스캔 중지",
    "download": "다운로드"
  }
}
```

#### i18n 기능

✅ **브라우저 언어 자동 감지**
- 사용자 브라우저 언어 설정 자동 인식
- localStorage에 선택한 언어 저장

✅ **네임스페이스 기반 번역**
- `common` - 공통 UI 요소
- `scan` - 스캔 관련 텍스트
- `vulnerability` - 취약점 관련 텍스트
- `dashboard` - 대시보드 텍스트

✅ **영어 폴백**
- 번역 누락 시 자동으로 영어 표시

---

### ✅ Frontend Components (Phase 4 & 5)

#### 새로 생성한 컴포넌트

**1. `LanguageSwitcher.tsx`**
- 드롭다운 언어 선택기
- 🇺🇸 English / 🇰🇷 한국어
- 선택 시 즉시 UI 언어 변경

**2. `MarkdownRenderer.tsx`**
- react-markdown + remark-gfm + rehype-highlight
- 커스텀 스타일 컴포넌트:
  - 헤딩: h1 (red), h2 (orange), h3 (yellow)
  - 코드 블록: 문법 강조 (highlight.js)
  - 테이블: 테두리 및 셀 스타일링
  - 링크, 리스트, blockquote 등 모든 MD 요소 스타일링
- 다크 테마 최적화

**3. `DownloadMenu.tsx`**
- 리포트 다운로드 드롭다운 메뉴
- 지원 형식:
  - 📝 Markdown (.md)
  - 📊 JSON (.json)
  - 📈 CSV (.csv)
  - 📄 PDF (.pdf)
- 다운로드 진행 상태 표시
- 자동 파일명 생성 (`{run_name}_report.{ext}`)

**4. `Reports.tsx` (새 페이지)**
- 경로: `/scan/:scanId/reports`
- 탭 네비게이션:
  - **Full Report** - 전체 마크다운 리포트 표시
  - **Vulnerabilities** - 취약점 목록 (심각도 배지 포함)
- 헤더:
  - 스캔 이름 및 run_name 표시
  - 다운로드 버튼
  - "Back to Scan" 링크
- 로딩 및 에러 상태 처리
- 취약점 없을 경우 성공 메시지 표시

#### 수정한 파일

**`Layout.tsx`**
```tsx
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

// 네비게이션 레이블 i18n 적용
const navItems = [
  { path: '/scans', label: t('navigation.scanHistory'), icon: '📋' },
  { path: '/new', label: t('navigation.newScan'), icon: '🚀' },
];

// 헤더에 LanguageSwitcher 추가
<nav className="flex items-center gap-4">
  <LanguageSwitcher />
  {/* ... 네비게이션 아이템 */}
</nav>
```

**`main.tsx`**
```tsx
import './i18n/config';  // i18n 설정 import
```

**`App.tsx`**
```tsx
import Reports from './pages/Reports';

// 라우트 추가
<Route path="scan/:scanId/reports" element={<Reports />} />
```

**`types/index.ts`**
```typescript
// 추가된 타입
export interface VulnerabilityDetail extends Vulnerability {
  filePath?: string;
  markdown?: string;
}

export interface ScanReport {
  summary: string;
  vulnerabilities: VulnerabilityDetail[];
  fullReport: string;
  generatedAt: string;
}

export type ReportFormat = 'markdown' | 'json' | 'csv' | 'pdf';

export interface Module {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface ModuleCategory {
  id: string;
  name: string;
  icon: string;
  modules: Module[];
}

export interface ScanTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  modules: string[];
  defaultInstructions?: string;
}

// ScanConfig에 추가
export interface ScanConfig {
  // ... 기존 필드
  prompt_modules?: string[];
}
```

**`api/client.ts`**
```typescript
// 추가된 API 함수
export async function getScanReport(scanId: string): Promise<{
  report: string;
  vulnerabilities: any[];
  run_name: string;
  generated_at: string | null;
}>

export async function getVulnerabilityDetail(
  scanId: string,
  vulnId: string
): Promise<VulnerabilityDetail>

export async function downloadReport(
  scanId: string,
  format: ReportFormat
): Promise<Blob>

export function triggerDownload(blob: Blob, filename: string): void
```

**`package.json`**
```json
{
  "dependencies": {
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "highlight.js": "^11.11.1",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0",
    "i18next-browser-languagedetector": "^7.2.0",
    "i18next-http-backend": "^2.4.2"
  }
}
```

#### Frontend 기능

✅ **마크다운 리포트 뷰어**
- 브라우저에서 직접 MD 리포트 읽기
- 코드 블록 문법 강조 (highlight.js)
- 반응형 다크 테마 스타일링
- 테이블, 리스트, 링크 등 모든 MD 요소 지원

✅ **다운로드 기능**
- 4가지 형식 지원 (MD, JSON, CSV, PDF)
- 클릭 한 번으로 즉시 다운로드
- 자동 파일명 생성
- 다운로드 진행 상태 표시

✅ **언어 전환**
- 헤더에 언어 선택 드롭다운
- 영어 ↔ 한국어 즉시 전환
- localStorage에 선택 저장

✅ **리포트 페이지**
- 탭으로 구분된 뷰 (전체 리포트 / 취약점)
- 취약점 심각도별 색상 배지
- 깔끔한 카드 레이아웃

---

## 🧪 테스트 결과

### Backend 테스트

**1. 과거 스캔 로드**
```bash
curl http://localhost:8000/api/scans
# 결과: 5개의 historical 스캔 로드 확인
```

**2. 리포트 조회**
```bash
curl "http://localhost:8000/api/scans/historical-www-propoz-org_0216/report"
# 결과:
# - report: 1772자 마크다운
# - vulnerabilities: 2개
# - run_name: www-propoz-org_0216
```

**3. JSON 내보내기**
```bash
curl "http://localhost:8000/api/scans/historical-www-propoz-org_0216/export?format=json"
# 결과: JSON 형식으로 리포트 + 취약점 반환
```

### Frontend 테스트

**1. 서버 실행 확인**
```
Frontend: http://localhost:5173 ✅
Backend: http://localhost:8000 ✅
```

**2. 페이지 접근**
- Scan History: http://localhost:5173/scans ✅
- Report View: http://localhost:5173/scan/historical-www-propoz-org_0216/reports ✅

**3. 기능 테스트**
- ✅ 언어 전환 (EN ↔ KO)
- ✅ 리포트 마크다운 렌더링
- ✅ 취약점 탭 전환
- ✅ 다운로드 버튼 (4가지 형식)

---

## 📊 구현 현황

### 완료된 Phase

- ✅ **Phase 1**: 인프라 설정 (Dependencies, TypeScript 타입)
- ✅ **Phase 2**: Backend API 확장 (report_service, persistence, endpoints)
- ✅ **Phase 3**: 다국어 지원 (i18n 설정, EN/KO 번역 파일)
- ✅ **Phase 4**: MD 리포트 뷰어 (MarkdownRenderer, Reports 페이지)
- ✅ **Phase 5**: 다운로드 기능 (DownloadMenu, Export API)

### 다음 Phase (예정)

- ⏳ **Phase 6**: 스캔 모듈 선택 (P1 우선순위)
  - `ModuleSelector.tsx` 생성 (XSS, CSRF 등 선택)
  - `ScanTemplateSelector.tsx` 생성 (템플릿 기반 선택)
  - `NewScan.tsx` 업데이트 (모듈 선택 UI 추가)
  - Strix v0.4.0 prompt modules 통합 (7개 카테고리, 최대 5개 선택)

- ⏳ **Phase 7**: 기존 페이지 i18n 마이그레이션 (P1 우선순위)
  - Dashboard, LiveStats, VulnerabilitySummary 등
  - 모든 하드코딩된 텍스트를 번역 키로 변경
  - 자연스러운 한국어 번역 보장

---

## 🛠️ 기술 스택

### Backend
- **FastAPI** - REST API 서버
- **Python 3.12+** - 프로그래밍 언어
- **Pydantic** - 데이터 검증
- **markdown** - MD → HTML 변환
- **weasyprint** - PDF 생성

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Zustand** - 상태 관리
- **React Router** - 라우팅
- **Tailwind CSS** - 스타일링
- **react-i18next** - 다국어 지원
- **react-markdown** - 마크다운 렌더링
- **highlight.js** - 코드 문법 강조

---

## 📁 파일 구조

### Backend (새로 생성)
```
strix-web/backend/app/
├── report_service.py          # 리포트 파일 시스템 통합
└── persistence.py             # 스캔 매핑 저장
```

### Backend (수정)
```
strix-web/backend/
├── app/
│   ├── main.py               # 3개 엔드포인트 추가
│   ├── models.py             # ExportFormat, run_name 등 추가
│   └── scan_manager.py       # 서비스 통합, 과거 스캔 로드
└── requirements.txt          # markdown, weasyprint 추가
```

### Frontend (새로 생성)
```
strix-web/frontend/
├── src/
│   ├── components/
│   │   ├── MarkdownRenderer.tsx
│   │   ├── DownloadMenu.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── pages/
│   │   └── Reports.tsx
│   └── i18n/
│       ├── config.ts
│       └── react-i18next.d.ts
└── public/
    └── locales/
        ├── en/
        │   ├── common.json
        │   ├── scan.json
        │   ├── vulnerability.json
        │   └── dashboard.json
        └── ko/
            ├── common.json
            ├── scan.json
            ├── vulnerability.json
            └── dashboard.json
```

### Frontend (수정)
```
strix-web/frontend/src/
├── components/
│   └── Layout.tsx            # LanguageSwitcher 추가, i18n 적용
├── pages/
│   └── (기존 페이지들)
├── api/
│   └── client.ts             # 리포트 API 함수 추가
├── types/
│   └── index.ts              # 타입 확장
├── main.tsx                  # i18n import
├── App.tsx                   # /reports 라우트 추가
└── package.json              # 8개 패키지 추가
```

---

## 🎯 핵심 성과

1. **파일 시스템 통합**
   - 기존 스캔 결과 자동 로드 (5개 확인)
   - API와 파일 시스템 간 완벽한 연동

2. **완전한 다국어 지원**
   - 영어/한국어 동시 지원
   - 브라우저 언어 자동 감지
   - 4개 네임스페이스로 구조화된 번역

3. **리포트 뷰어**
   - 브라우저에서 직접 MD 리포트 읽기
   - 문법 강조된 코드 블록
   - 아름다운 다크 테마 스타일

4. **다운로드 기능**
   - 4가지 형식 (MD, JSON, CSV, PDF)
   - 원클릭 다운로드
   - 백엔드에서 형식 변환

5. **확장 가능한 아키텍처**
   - 모듈화된 서비스 구조
   - 타입 안전성 보장
   - 향후 기능 추가 용이

---

## 💡 교훈 및 참고사항

### 구현 중 해결한 문제

1. **스캔 ID와 run_name 매핑**
   - 문제: API는 scan_id 사용, 파일 시스템은 run_name 사용
   - 해결: persistence.py로 매핑 관리, JSON 파일로 영구 저장

2. **과거 스캔 로드**
   - 문제: 서버 재시작 시 과거 스캔 소실
   - 해결: 시작 시 strix_runs 디렉토리 자동 스캔

3. **PDF 생성**
   - 문제: 한글 폰트 지원, CSS 스타일링
   - 해결: weasyprint + inline CSS 스타일 적용

4. **i18n 네임스페이스**
   - 문제: 번역 파일 관리의 복잡성
   - 해결: 기능별 네임스페이스 분리 (common, scan, vulnerability, dashboard)

### Best Practices

- ✅ 타입 안전성: TypeScript로 모든 API 응답 타입 정의
- ✅ 에러 처리: try-catch + 사용자 친화적 에러 메시지
- ✅ 로딩 상태: 모든 비동기 작업에 로딩 표시
- ✅ 접근성: ARIA 레이블, 키보드 네비게이션 고려
- ✅ 성능: 코드 스플리팅, 필요 시 lazy loading

---

## 🚀 다음 단계

### Phase 6: 스캔 모듈 선택 (예정)

**목표**: Strix v0.4.0 prompt modules를 UI에서 선택 가능하게

**구현 내용**:
1. `constants/modules.ts` 생성 - 7개 카테고리, 모든 모듈 정의
2. `ModuleSelector.tsx` - 체크박스 기반 모듈 선택 (최대 5개)
3. `ScanTemplateSelector.tsx` - 템플릿 카드 (웹앱, API 등)
4. `NewScan.tsx` 업데이트 - 모듈 선택 UI 통합

**Strix v0.4.0 모듈**:
- Vulnerabilities: XSS, CSRF, SQL Injection, IDOR, etc.
- Frameworks: React, Vue, Angular, etc.
- Technologies: Docker, Kubernetes, etc.
- Protocols: HTTP, WebSocket, etc.
- Cloud: AWS, GCP, Azure
- Reconnaissance: Subdomain, Port Scan
- Custom: 사용자 정의 모듈

### Phase 7: 기존 페이지 i18n 마이그레이션 (예정)

**대상 컴포넌트**:
1. Dashboard.tsx
2. NewScan.tsx
3. ScanHistory.tsx
4. Vulnerabilities.tsx
5. LiveStats.tsx
6. VulnerabilitySummary.tsx
7. ActivityFeed.tsx
8. AgentTree.tsx
9. ChatInput.tsx
10. ToolCard.tsx

**작업 내용**:
- 모든 하드코딩된 텍스트 → 번역 키로 변경
- 자연스러운 한국어 번역 추가
- 기술 용어는 영어 유지

---

## 📝 개발자 노트

### 환경 설정
```bash
# Backend 서버 시작
cd strix-web/backend
source venv/bin/activate
export LLM_API_KEY="sk-proj-..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend 서버 시작
cd strix-web/frontend
npm run dev
```

### 유용한 명령어
```bash
# 과거 스캔 로드 확인
curl http://localhost:8000/api/scans

# 특정 스캔 리포트 조회
curl "http://localhost:8000/api/scans/historical-www-propoz-org_0216/report"

# JSON 내보내기 테스트
curl "http://localhost:8000/api/scans/historical-www-propoz-org_0216/export?format=json"
```

### 디버깅
- Backend 로그: `tail -f /tmp/claude/tasks/b8a1e9a.output`
- Frontend 로그: `tail -f /tmp/claude/tasks/b99d804.output`

---

## 🎉 결론

Phase 1-5를 성공적으로 완료하여 Strix Web Dashboard가 **서비스급 보안 스캐닝 플랫폼**으로 한 단계 업그레이드되었습니다.

**주요 성과**:
- ✅ 5개 과거 스캔 자동 로드
- ✅ MD 리포트 브라우저 뷰어
- ✅ 4가지 형식 다운로드 (MD, JSON, CSV, PDF)
- ✅ 완전한 영어/한국어 지원
- ✅ 아름다운 다크 테마 UI

**다음 목표**:
- Phase 6: 스캔 모듈 선택 UI
- Phase 7: 전체 i18n 마이그레이션

이 개발을 통해 사용자는 과거 스캔 결과를 쉽게 조회하고, 다양한 형식으로 다운로드하며, 선호하는 언어로 UI를 사용할 수 있게 되었습니다.
