import type { Scan, ScanSummary, Target, Vulnerability } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Scan API
export async function createScan(params: {
  targets: Target[];
  user_instructions?: string;
  llm_model?: string;
  max_iterations?: number;
  name?: string;
}): Promise<{ id: string; status: string; message: string }> {
  return request('/scans', {
    method: 'POST',
    body: JSON.stringify({
      targets: params.targets.map(t => ({
        type: t.type,
        value: t.value,
        workspace_subdir: t.workspace_subdir,
      })),
      user_instructions: params.user_instructions || '',
      llm_model: params.llm_model || 'openai/gpt-4o',
      max_iterations: params.max_iterations || 300,
      name: params.name,
    }),
  });
}

export async function listScans(): Promise<{ scans: ScanSummary[] }> {
  return request('/scans');
}

export async function getScan(scanId: string): Promise<Scan> {
  return request(`/scans/${scanId}`);
}

export async function stopScan(scanId: string): Promise<{ message: string; id: string }> {
  return request(`/scans/${scanId}/stop`, { method: 'POST' });
}

export async function sendMessage(scanId: string, message: string): Promise<{ message: string; id: string }> {
  return request(`/scans/${scanId}/message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getVulnerabilities(scanId: string): Promise<{
  vulnerabilities: Vulnerability[];
  summary: Record<string, number>;
}> {
  return request(`/scans/${scanId}/vulnerabilities`);
}

// WebSocket connection
export function connectWebSocket(
  scanId: string,
  onMessage: (event: MessageEvent) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/${scanId}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    onOpen?.();
  };

  ws.onmessage = onMessage;

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    onClose?.();
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError?.(error);
  };

  return ws;
}

export function sendWSMessage(ws: WebSocket, type: string, content: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, content }));
  }
}
