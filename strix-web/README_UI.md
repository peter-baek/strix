# Strix Web Dashboard UI Documentation

## 개요
Strix Web Dashboard는 보안 스캐닝 도구의 실시간 모니터링을 위한 웹 인터페이스입니다. React + TypeScript 기반으로 구축되었으며, WebSocket을 통해 실시간으로 스캔 상태를 업데이트합니다.

## 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **Tailwind CSS** - 스타일링

### Backend
- **FastAPI** - Python 웹 프레임워크
- **Pydantic** - 데이터 검증
- **WebSocket** - 실시간 통신

## 프로젝트 구조

```
strix-web/
├── frontend/
│   ├── src/
│   │   ├── components/       # UI 컴포넌트
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── store/            # 상태 관리
│   │   ├── api/              # API 클라이언트
│   │   ├── types/            # TypeScript 타입 정의
│   │   └── App.tsx           # 메인 애플리케이션
│   ├── public/               # 정적 파일
│   └── package.json
└── backend/
    └── app/
        ├── models.py         # 데이터 모델
        ├── websocket_manager.py  # WebSocket 관리
        └── __init__.py
```

## 주요 페이지

### 1. Dashboard (`/scan/:scanId`)
스캔의 실시간 모니터링 페이지

**위치**: `frontend/src/pages/Dashboard.tsx`

**주요 기능**:
- 실시간 에이전트 상태 모니터링
- WebSocket 연결을 통한 실시간 업데이트
- 스캔 중지 기능
- 에이전트와의 양방향 채팅

**레이아웃**:
```
┌─────────────────────────────────────────┐
│ Header: Scan Info | Status | Stop Button │
├──────────────┬──────────────────────────┤
│              │                          │
│ Sidebar:     │ Main Content:            │
│ - Agent Tree │ - Activity Feed          │
│ - Live Stats │ - Tool Executions        │
│ - Vulns      │                          │
│              │                          │
│              ├──────────────────────────┤
│              │ Chat Input               │
└──────────────┴──────────────────────────┘
```

### 2. Scan History (`/scans`)
과거 스캔 목록 조회

**위치**: `frontend/src/pages/ScanHistory.tsx`

**주요 기능**:
- 모든 스캔 목록 표시
- 스캔 상태별 필터링
- 스캔 상세보기로 이동

### 3. New Scan (`/new`)
새로운 스캔 생성

**위치**: `frontend/src/pages/NewScan.tsx`

**주요 기능**:
- 타겟 설정 (Repository, Local Code, Web App, IP)
- 스캔 설정 구성
- LLM 모델 선택
- 최대 반복 횟수 설정

### 4. Vulnerabilities (`/scan/:scanId/vulnerabilities`)
발견된 취약점 상세보기

**위치**: `frontend/src/pages/Vulnerabilities.tsx`

**주요 기능**:
- 취약점 목록 표시
- 심각도별 필터링 (Critical, High, Medium, Low, Info)
- 취약점 상세 내용 조회

## 주요 컴포넌트

### AgentTree
**위치**: `frontend/src/components/AgentTree.tsx`

에이전트 계층 구조를 트리 형태로 표시합니다.

**Props**:
- `agents: Record<string, Agent>` - 에이전트 딕셔너리

**기능**:
- 부모-자식 관계 시각화
- 에이전트 상태 표시 (Running, Completed, Failed, Pending)
- 상태별 색상 구분

### LiveStats
**위치**: `frontend/src/components/LiveStats.tsx`

실시간 스캔 통계를 표시합니다.

**Props**:
- `stats: LiveStats` - 통계 데이터
- `status: string` - 스캔 상태

**표시 정보**:
- Agents: 생성된 에이전트 수
- Tools: 실행된 도구 수
- Tokens: 사용된 토큰 수 (입력/출력)
- Cost: 예상 비용 (USD)

### VulnerabilitySummary
**위치**: `frontend/src/components/VulnerabilitySummary.tsx`

발견된 취약점을 심각도별로 요약합니다.

**Props**:
- `vulnerabilities: Vulnerability[]` - 취약점 목록
- `scanId: string` - 스캔 ID

**기능**:
- 심각도별 카운트 (Critical, High, Medium, Low, Info)
- 색상 코딩
- 상세보기 페이지로 링크

### ActivityFeed
**위치**: `frontend/src/components/ActivityFeed.tsx`

도구 실행 활동을 시간순으로 표시합니다.

**Props**:
- `toolExecutions: Record<number, ToolExecution>` - 도구 실행 기록

**기능**:
- 실시간 활동 스트림
- 도구 실행 상태 (Running, Completed, Failed)
- 실행 결과 표시
- 자동 스크롤

### ChatInput
**위치**: `frontend/src/components/ChatInput.tsx`

실행 중인 에이전트와 소통할 수 있는 채팅 입력 컴포넌트입니다.

**Props**:
- `onSend: (message: string) => void` - 메시지 전송 핸들러
- `disabled: boolean` - 비활성화 여부
- `placeholder: string` - 플레이스홀더 텍스트

**기능**:
- 멀티라인 입력
- Enter 키로 전송 (Shift+Enter로 줄바꿈)
- 스캔 중지 시 비활성화

### Layout
**위치**: `frontend/src/components/Layout.tsx`

전체 페이지 레이아웃 구조를 정의합니다.

**기능**:
- 상단 네비게이션 바
- 사이드바 (선택적)
- 메인 콘텐츠 영역
- React Router Outlet

### ToolCard
**위치**: `frontend/src/components/ToolCard.tsx`

개별 도구 실행 정보를 카드 형태로 표시합니다.

**Props**:
- `tool: ToolExecution` - 도구 실행 정보

**기능**:
- 도구 이름 및 인자 표시
- 실행 시간 표시
- 결과 출력
- 상태별 스타일링

## 상태 관리

### scanStore
**위치**: `frontend/src/store/scanStore.ts`

Zustand를 사용한 전역 상태 관리

**상태**:
```typescript
{
  currentScan: ScanRun | null,      // 현재 활성 스캔
  scans: ScanRun[],                 // 모든 스캔 목록
  isConnected: boolean,             // WebSocket 연결 상태
}
```

**액션**:
- `setCurrentScan(scan)` - 현재 스캔 설정
- `setConnected(status)` - 연결 상태 업데이트
- `handleWSEvent(event)` - WebSocket 이벤트 처리
- `addAgent(agent)` - 에이전트 추가
- `updateAgent(id, updates)` - 에이전트 업데이트
- `addToolExecution(tool)` - 도구 실행 추가
- `addVulnerability(vuln)` - 취약점 추가
- `updateStats(stats)` - 통계 업데이트

## API 클라이언트

### client.ts
**위치**: `frontend/src/api/client.ts`

백엔드 API와의 통신을 담당합니다.

**주요 함수**:

#### REST API
```typescript
// 스캔 목록 조회
getScans(): Promise<ScanRun[]>

// 특정 스캔 조회
getScan(scanId: string): Promise<ScanRun>

// 새 스캔 생성
createScan(config: ScanConfig): Promise<ScanRun>

// 스캔 중지
stopScan(scanId: string): Promise<void>

// 메시지 전송 (REST)
sendMessage(scanId: string, message: string): Promise<void>
```

#### WebSocket
```typescript
// WebSocket 연결
connectWebSocket(
  scanId: string,
  onMessage: (event: MessageEvent) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: () => void
): WebSocket

// WebSocket 메시지 전송
sendWSMessage(
  ws: WebSocket,
  type: string,
  data: any
): void
```

## 데이터 모델

### TypeScript 타입
**위치**: `frontend/src/types/index.ts`

주요 타입 정의:
```typescript
interface ScanRun {
  id: string;
  name: string | null;
  config: ScanConfig;
  status: string;
  agents: Record<string, Agent>;
  tool_executions: Record<number, ToolExecution>;
  chat_messages: ChatMessage[];
  vulnerabilities: Vulnerability[];
  stats: LiveStats;
  started_at: string;
  completed_at: string | null;
}

interface Agent {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  error_message: string | null;
}

interface ToolExecution {
  id: number;
  agent_id: string;
  tool_name: string;
  args: Record<string, any>;
  status: ToolStatus;
  result: any;
  started_at: string;
  completed_at: string | null;
}

interface Vulnerability {
  id: string;
  title: string;
  content: string;
  severity: Severity;
  timestamp: string;
}

interface LiveStats {
  agents: number;
  tools: number;
  tokens: number;
  cost: number;
  input_tokens: number;
  output_tokens: number;
}
```

### Python 모델
**위치**: `backend/app/models.py`

Pydantic 기반 데이터 모델:
- `TargetType` - 타겟 유형 (repository, local_code, web_application, ip_address)
- `AgentStatus` - 에이전트 상태 (running, completed, failed, pending, waiting_for_user)
- `ToolStatus` - 도구 상태 (running, completed, failed)
- `Severity` - 심각도 (critical, high, medium, low, info)
- `ScanRun` - 스캔 실행 정보
- `Agent` - 에이전트 정보
- `ToolExecution` - 도구 실행 정보
- `Vulnerability` - 취약점 정보
- `WSEventType` - WebSocket 이벤트 타입

## WebSocket 이벤트

### 이벤트 타입
**위치**: `backend/app/models.py:114-124`

```python
class WSEventType(str, Enum):
    SCAN_STARTED = "scan_started"
    SCAN_COMPLETED = "scan_completed"
    AGENT_CREATED = "agent_created"
    AGENT_STATUS_CHANGED = "agent_status_changed"
    TOOL_EXECUTION_START = "tool_execution_start"
    TOOL_EXECUTION_COMPLETE = "tool_execution_complete"
    CHAT_MESSAGE = "chat_message"
    VULNERABILITY_FOUND = "vulnerability_found"
    STATS_UPDATE = "stats_update"
    USER_MESSAGE = "user_message"
```

### 이벤트 흐름
1. 클라이언트가 `/ws/{scan_id}` 엔드포인트로 WebSocket 연결
2. 백엔드가 스캔 진행 상황에 따라 이벤트 전송
3. 프론트엔드가 `handleWSEvent`로 이벤트 처리
4. 상태 업데이트 및 UI 리렌더링

## 스타일링

### Tailwind CSS 설정
**위치**: `frontend/tailwind.config.js`

커스텀 테마:
```javascript
colors: {
  'strix-bg': '#0a0e14',           // 배경색
  'strix-surface': '#151a21',      // 서페이스색
  'strix-border': '#1f2937',       // 경계선색
  'strix-text-primary': '#e5e7eb', // 주요 텍스트
  'strix-text-secondary': '#9ca3af', // 보조 텍스트
  'strix-text-muted': '#6b7280',   // 비활성 텍스트
  'accent-green': '#10b981',        // 성공
  'accent-red': '#ef4444',          // 에러/실패
  'accent-orange': '#f59e0b',       // 경고
  'accent-blue': '#3b82f6',         // 정보
}
```

### 디자인 시스템
- **Dark Theme**: 다크 모드 중심 디자인
- **Color Coding**: 상태별 색상 구분
  - Green: Running, Completed, Success
  - Red: Failed, Error, Critical
  - Orange: Warning, Pending
  - Blue: Info, Neutral
- **Typography**: 가독성 중심의 폰트 크기 및 간격
- **Spacing**: 일관된 패딩 및 마진 사용

## 라우팅

### 라우트 구조
**위치**: `frontend/src/App.tsx:10-18`

```typescript
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Navigate to="/scans" replace />} />
    <Route path="scan/:scanId" element={<Dashboard />} />
    <Route path="scans" element={<ScanHistory />} />
    <Route path="new" element={<NewScan />} />
    <Route path="scan/:scanId/vulnerabilities" element={<Vulnerabilities />} />
  </Route>
</Routes>
```

### 네비게이션 플로우
```
/scans (스캔 목록)
  → /new (새 스캔 생성)
    → /scan/:scanId (스캔 대시보드)
      → /scan/:scanId/vulnerabilities (취약점 상세)
```

## 개발 가이드

### 설치 및 실행

#### Frontend
```bash
cd strix-web/frontend
npm install
npm run dev
```

#### Backend
```bash
cd strix-web/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 빌드
```bash
# Frontend 프로덕션 빌드
cd frontend
npm run build

# 빌드 파일은 frontend/dist에 생성됨
```

### 환경 변수
프론트엔드의 API 엔드포인트는 개발 중 `http://localhost:8000`을 기본으로 사용합니다.

프로덕션 환경에서는 환경 변수로 설정할 수 있습니다:
```bash
VITE_API_URL=https://your-api-domain.com
```

## 주요 기능 구현

### 1. 실시간 업데이트
- WebSocket 연결을 통한 양방향 통신
- 자동 재연결 로직
- 연결 상태 표시

### 2. 상태 동기화
- Zustand를 통한 중앙화된 상태 관리
- WebSocket 이벤트 기반 상태 업데이트
- 낙관적 UI 업데이트

### 3. 에이전트 트리 시각화
- 재귀적 컴포넌트를 통한 계층 구조 표시
- 동적 상태 업데이트
- 확장/축소 기능 (추가 예정)

### 4. 활동 피드
- 시간순 정렬
- 무한 스크롤 (추가 예정)
- 실시간 추가

### 5. 채팅 인터페이스
- 실행 중인 에이전트와 양방향 소통
- WebSocket 우선, REST API 폴백
- 입력 검증

## TODO 및 개선 사항

### 단기
- [ ] 에이전트 트리 확장/축소 기능
- [ ] 활동 피드 필터링
- [ ] 취약점 상세 페이지 구현
- [ ] 에러 처리 개선
- [ ] 로딩 상태 개선

### 중기
- [ ] 다크/라이트 테마 토글
- [ ] 스캔 설정 프리셋
- [ ] 실시간 알림
- [ ] 내보내기 기능 (PDF, CSV)
- [ ] 검색 기능

### 장기
- [ ] 대시보드 커스터마이징
- [ ] 다중 스캔 비교
- [ ] 협업 기능
- [ ] AI 기반 취약점 분석
- [ ] 플러그인 시스템

## 파일 참조

### 주요 파일 위치
- 메인 앱: `frontend/src/App.tsx:1-21`
- 대시보드: `frontend/src/pages/Dashboard.tsx:1-188`
- 상태 관리: `frontend/src/store/scanStore.ts`
- API 클라이언트: `frontend/src/api/client.ts`
- 데이터 모델: `backend/app/models.py:1-131`
- WebSocket 관리: `backend/app/websocket_manager.py`

## 트러블슈팅

### WebSocket 연결 실패
- 백엔드가 실행 중인지 확인
- CORS 설정 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 스캔이 시작되지 않음
- 백엔드 로그 확인
- 스캔 설정 검증
- 타겟 접근 가능 여부 확인

### UI가 업데이트되지 않음
- WebSocket 연결 상태 확인
- Redux DevTools로 상태 변경 확인
- 브라우저 캐시 클리어

## 라이선스
이 프로젝트는 Strix 프로젝트의 일부입니다.
