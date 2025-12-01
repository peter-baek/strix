import { create } from 'zustand';
import type { Agent, ChatMessage, LiveStats, Scan, ToolExecution, Vulnerability, WSEvent } from '../types';

interface ScanState {
  currentScan: Scan | null;
  scans: Scan[];
  isConnected: boolean;

  // Actions
  setCurrentScan: (scan: Scan | null) => void;
  setScans: (scans: Scan[]) => void;
  setConnected: (connected: boolean) => void;

  // Real-time updates
  addAgent: (agent: Agent) => void;
  updateAgentStatus: (agentId: string, status: string, errorMessage?: string) => void;
  addToolExecution: (execution: ToolExecution) => void;
  updateToolExecution: (executionId: number, status: string, result?: unknown) => void;
  addChatMessage: (message: ChatMessage) => void;
  addVulnerability: (vuln: Vulnerability) => void;
  updateStats: (stats: Partial<LiveStats>) => void;
  setScanStatus: (status: string) => void;

  // Handle WebSocket events
  handleWSEvent: (event: WSEvent) => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  currentScan: null,
  scans: [],
  isConnected: false,

  setCurrentScan: (scan) => set({ currentScan: scan }),
  setScans: (scans) => set({ scans }),
  setConnected: (connected) => set({ isConnected: connected }),

  addAgent: (agent) => set((state) => {
    if (!state.currentScan) return state;
    return {
      currentScan: {
        ...state.currentScan,
        agents: {
          ...state.currentScan.agents,
          [agent.id]: agent,
        },
      },
    };
  }),

  updateAgentStatus: (agentId, status, errorMessage) => set((state) => {
    if (!state.currentScan?.agents[agentId]) return state;
    return {
      currentScan: {
        ...state.currentScan,
        agents: {
          ...state.currentScan.agents,
          [agentId]: {
            ...state.currentScan.agents[agentId],
            status: status as Agent['status'],
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          },
        },
      },
    };
  }),

  addToolExecution: (execution) => set((state) => {
    if (!state.currentScan) return state;
    return {
      currentScan: {
        ...state.currentScan,
        tool_executions: {
          ...state.currentScan.tool_executions,
          [execution.id.toString()]: execution,
        },
      },
    };
  }),

  updateToolExecution: (executionId, status, result) => set((state) => {
    const execKey = executionId.toString();
    if (!state.currentScan?.tool_executions[execKey]) return state;
    return {
      currentScan: {
        ...state.currentScan,
        tool_executions: {
          ...state.currentScan.tool_executions,
          [execKey]: {
            ...state.currentScan.tool_executions[execKey],
            status: status as ToolExecution['status'],
            result,
            completed_at: new Date().toISOString(),
          },
        },
      },
    };
  }),

  addChatMessage: (message) => set((state) => {
    if (!state.currentScan) return state;
    return {
      currentScan: {
        ...state.currentScan,
        chat_messages: [...state.currentScan.chat_messages, message],
      },
    };
  }),

  addVulnerability: (vuln) => set((state) => {
    if (!state.currentScan) return state;
    return {
      currentScan: {
        ...state.currentScan,
        vulnerabilities: [...state.currentScan.vulnerabilities, vuln],
      },
    };
  }),

  updateStats: (stats) => set((state) => {
    if (!state.currentScan) return state;
    return {
      currentScan: {
        ...state.currentScan,
        stats: { ...state.currentScan.stats, ...stats },
      },
    };
  }),

  setScanStatus: (status) => set((state) => {
    if (!state.currentScan) return state;
    return {
      currentScan: {
        ...state.currentScan,
        status,
        completed_at: status === 'completed' || status === 'failed' || status === 'stopped'
          ? new Date().toISOString()
          : undefined,
      },
    };
  }),

  handleWSEvent: (event) => {
    const { type, data } = event;

    switch (type) {
      case 'initial_state':
        set({
          currentScan: {
            id: data.id as string,
            status: data.status as string,
            config: { targets: [], user_instructions: '', llm_model: '', max_iterations: 300 },
            agents: data.agents as Record<string, Agent>,
            tool_executions: data.tool_executions as Record<string, ToolExecution>,
            chat_messages: [],
            vulnerabilities: data.vulnerabilities as Vulnerability[],
            stats: data.stats as LiveStats,
            started_at: new Date().toISOString(),
          },
        });
        break;

      case 'agent_created':
        get().addAgent({
          id: data.agent_id as string,
          name: data.name as string,
          task: data.task as string,
          status: 'running',
          parent_id: data.parent_id as string | null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;

      case 'agent_status_changed':
        get().updateAgentStatus(
          data.agent_id as string,
          data.status as string,
          data.error_message as string | undefined
        );
        break;

      case 'tool_execution_start':
        get().addToolExecution({
          id: data.execution_id as number,
          agent_id: data.agent_id as string,
          tool_name: data.tool_name as string,
          args: data.args as Record<string, unknown>,
          status: 'running',
          started_at: new Date().toISOString(),
        });
        break;

      case 'tool_execution_complete':
        get().updateToolExecution(
          data.execution_id as number,
          data.status as string,
          data.result
        );
        break;

      case 'chat_message':
        get().addChatMessage({
          id: data.message_id as number,
          content: data.content as string,
          role: data.role as string,
          agent_id: data.agent_id as string | undefined,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'vulnerability_found':
        get().addVulnerability({
          id: data.id as string,
          title: data.title as string,
          content: data.content as string,
          severity: data.severity as Vulnerability['severity'],
          timestamp: new Date().toISOString(),
        });
        break;

      case 'stats_update':
        get().updateStats({
          agents: data.agents as number,
          tools: data.tools as number,
          tokens: data.tokens as number,
          cost: data.cost as number,
        });
        break;

      case 'scan_completed':
        get().setScanStatus(data.success ? 'completed' : 'failed');
        break;
    }
  },
}));
