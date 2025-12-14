// Target types
export type TargetType = 'repository' | 'local_code' | 'web_application' | 'ip_address';

export interface Target {
  type: TargetType;
  value: string;
  workspace_subdir?: string;
}

// Agent types
export type AgentStatus = 'running' | 'completed' | 'failed' | 'pending' | 'waiting_for_user';

export interface Agent {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

// Tool types
export type ToolStatus = 'running' | 'completed' | 'failed';

export type ToolName =
  | 'terminal_action'
  | 'browser_action'
  | 'python_action'
  | 'proxy_action'
  | 'notes_action'
  | 'thinking'
  | 'web_search'
  | 'file_edit'
  | 'agents_graph_action'
  | 'create_vulnerability_report'
  | 'finish'
  | 'scan_start_info'
  | 'subagent_start_info';

export interface ToolExecution {
  id: number;
  agent_id: string;
  tool_name: string;
  args: Record<string, unknown>;
  status: ToolStatus;
  result?: unknown;
  started_at: string;
  completed_at?: string;
}

// Chat types
export interface ChatMessage {
  id: number;
  content: string;
  role: string;
  agent_id?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Vulnerability types
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
  id: string;
  title: string;
  content: string;
  severity: Severity;
  timestamp: string;
}

// Extended vulnerability with file details
export interface VulnerabilityDetail extends Vulnerability {
  filePath?: string;
  markdown?: string;
}

// Stats types
export interface LiveStats {
  agents: number;
  tools: number;
  tokens: number;
  cost: number;
  input_tokens?: number;
  output_tokens?: number;
}

// Report types
export interface ScanReport {
  summary: string;
  vulnerabilities: VulnerabilityDetail[];
  fullReport: string;
  generatedAt: string;
}

export type ReportFormat = 'markdown' | 'json' | 'csv' | 'pdf';

// Module selection types
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

// Scan types
export interface ScanConfig {
  targets: Target[];
  user_instructions: string;
  llm_model: string;
  max_iterations: number;
  prompt_modules?: string[];
}

export interface Scan {
  id: string;
  name?: string;
  status: string;
  config: ScanConfig;
  agents: Record<string, Agent>;
  tool_executions: Record<string, ToolExecution>;
  chat_messages: ChatMessage[];
  vulnerabilities: Vulnerability[];
  stats: LiveStats;
  started_at: string;
  completed_at?: string;
}

export interface ScanSummary {
  id: string;
  name?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  vulnerabilities_count: number;
  agents_count: number;
}

// WebSocket event types
export type WSEventType =
  | 'scan_started'
  | 'scan_completed'
  | 'agent_created'
  | 'agent_status_changed'
  | 'tool_execution_start'
  | 'tool_execution_complete'
  | 'chat_message'
  | 'vulnerability_found'
  | 'stats_update'
  | 'initial_state';

export interface WSEvent {
  type: WSEventType;
  data: Record<string, unknown>;
  timestamp?: string;
}

// Tool icon/color mapping
export const TOOL_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  terminal_action: { icon: '>_', color: '#22c55e', label: 'Terminal' },
  browser_action: { icon: '🌐', color: '#06b6d4', label: 'Browser' },
  python_action: { icon: '🐍', color: '#3b82f6', label: 'Python' },
  proxy_action: { icon: '⇄', color: '#06b6d4', label: 'Proxy' },
  notes_action: { icon: '📝', color: '#fbbf24', label: 'Notes' },
  thinking: { icon: '💭', color: '#a855f7', label: 'Thinking' },
  web_search: { icon: '🔍', color: '#22c55e', label: 'Web Search' },
  file_edit: { icon: '📄', color: '#10b981', label: 'File Edit' },
  agents_graph_action: { icon: '🌳', color: '#fbbf24', label: 'Agents' },
  create_vulnerability_report: { icon: '📊', color: '#ea580c', label: 'Report' },
  finish: { icon: '✓', color: '#dc2626', label: 'Finish' },
  scan_start_info: { icon: '📋', color: '#22c55e', label: 'Scan Info' },
  subagent_start_info: { icon: '🤖', color: '#22c55e', label: 'Sub-Agent' },
};

// Agent status icon mapping
export const AGENT_STATUS_ICONS: Record<AgentStatus, string> = {
  running: '🟢',
  completed: '✅',
  failed: '❌',
  pending: '⏳',
  waiting_for_user: '💬',
};
