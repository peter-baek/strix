"""Data models for Strix Web Dashboard."""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TargetType(str, Enum):
    REPOSITORY = "repository"
    LOCAL_CODE = "local_code"
    WEB_APPLICATION = "web_application"
    IP_ADDRESS = "ip_address"


class AgentStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"
    WAITING_FOR_USER = "waiting_for_user"


class ToolStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ExportFormat(str, Enum):
    MARKDOWN = "md"
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"
    ZIP = "zip"


class Target(BaseModel):
    type: TargetType
    value: str
    workspace_subdir: str | None = None


class ScanConfig(BaseModel):
    targets: list[Target]
    user_instructions: str = ""
    llm_model: str = "openai/gpt-4o"
    max_iterations: int = 300
    prompt_modules: list[str] | None = None


class Agent(BaseModel):
    id: str
    name: str
    task: str
    status: AgentStatus = AgentStatus.PENDING
    parent_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    error_message: str | None = None


class ToolExecution(BaseModel):
    id: int
    agent_id: str
    tool_name: str
    args: dict[str, Any] = {}
    status: ToolStatus = ToolStatus.RUNNING
    result: Any = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None


class ChatMessage(BaseModel):
    id: int
    content: str
    role: str
    agent_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = {}


class Vulnerability(BaseModel):
    id: str
    title: str
    content: str
    severity: Severity
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LiveStats(BaseModel):
    agents: int = 0
    tools: int = 0
    tokens: int = 0
    cost: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0


class ScanRun(BaseModel):
    id: str
    name: str | None = None
    config: ScanConfig
    status: str = "running"
    agents: dict[str, Agent] = {}
    tool_executions: dict[int, ToolExecution] = {}
    chat_messages: list[ChatMessage] = []
    vulnerabilities: list[Vulnerability] = []
    stats: LiveStats = Field(default_factory=LiveStats)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    run_name: str | None = None
    is_historical: bool = False


# WebSocket Event Types
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


class WSEvent(BaseModel):
    type: WSEventType
    data: dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
