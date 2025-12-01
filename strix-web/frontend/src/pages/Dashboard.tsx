import { useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useScanStore } from '../store/scanStore';
import { getScan, connectWebSocket, sendMessage, stopScan, sendWSMessage } from '../api/client';
import type { WSEvent } from '../types';
import AgentTree from '../components/AgentTree';
import LiveStats from '../components/LiveStats';
import VulnerabilitySummary from '../components/VulnerabilitySummary';
import ActivityFeed from '../components/ActivityFeed';
import ChatInput from '../components/ChatInput';

export default function Dashboard() {
  const { scanId } = useParams<{ scanId: string }>();
  const wsRef = useRef<WebSocket | null>(null);

  const {
    currentScan,
    setCurrentScan,
    setConnected,
    isConnected,
    handleWSEvent,
  } = useScanStore();

  // Load initial scan data
  useEffect(() => {
    if (!scanId) return;

    const loadScan = async () => {
      try {
        const scan = await getScan(scanId);
        setCurrentScan(scan);
      } catch (error) {
        console.error('Failed to load scan:', error);
      }
    };

    loadScan();
  }, [scanId, setCurrentScan]);

  // Connect WebSocket
  useEffect(() => {
    if (!scanId) return;

    const ws = connectWebSocket(
      scanId,
      (event) => {
        try {
          const data = JSON.parse(event.data) as WSEvent;
          handleWSEvent(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      },
      () => setConnected(true),
      () => setConnected(false),
      () => setConnected(false)
    );

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [scanId, setConnected, handleWSEvent]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!scanId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendWSMessage(wsRef.current, 'user_message', message);
    } else {
      try {
        await sendMessage(scanId, message);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  }, [scanId]);

  const handleStopScan = useCallback(async () => {
    if (!scanId) return;
    if (confirm('Are you sure you want to stop the scan?')) {
      try {
        await stopScan(scanId);
      } catch (error) {
        console.error('Failed to stop scan:', error);
      }
    }
  }, [scanId]);

  if (!currentScan) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🦉</div>
          <p className="text-strix-text-secondary">Loading scan...</p>
        </div>
      </div>
    );
  }

  const isRunning = currentScan.status === 'running';

  return (
    <div className="h-full flex flex-col">
      {/* Sub-header with scan info */}
      <div className="border-b border-strix-border bg-strix-surface px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/scans"
            className="text-strix-text-secondary hover:text-strix-text-primary transition-colors"
          >
            ← Back
          </Link>
          <span className="text-strix-text-muted">|</span>
          <span className="text-sm font-medium">{currentScan.name || currentScan.id}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            isRunning ? 'bg-accent-green/20 text-accent-green' :
            currentScan.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
            currentScan.status === 'failed' ? 'bg-accent-red/20 text-accent-red' :
            'bg-strix-border text-strix-text-secondary'
          }`}>
            {currentScan.status.toUpperCase()}
          </span>
          {!isConnected && isRunning && (
            <span className="text-xs text-accent-orange animate-pulse">Reconnecting...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <button
              onClick={handleStopScan}
              className="px-3 py-1 text-sm bg-accent-red/20 text-accent-red hover:bg-accent-red/30 rounded transition-colors"
            >
              Stop Scan
            </button>
          )}
          <button
            onClick={() => {/* TODO: Help modal */}}
            className="px-2 py-1 text-strix-text-secondary hover:text-strix-text-primary transition-colors"
          >
            ?
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-strix-border bg-strix-surface flex flex-col">
          {/* Agent Tree */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-semibold text-strix-text-muted mb-2 uppercase tracking-wider">
              Agents
            </h3>
            <AgentTree agents={currentScan.agents} />
          </div>

          {/* Stats and Vulnerabilities */}
          <div className="p-3 space-y-3 border-t border-strix-border">
            <LiveStats stats={currentScan.stats} status={currentScan.status} />
            <VulnerabilitySummary
              vulnerabilities={currentScan.vulnerabilities}
              scanId={currentScan.id}
            />
          </div>
        </aside>

        {/* Activity Feed */}
        <main className="flex-1 flex flex-col overflow-hidden bg-strix-bg">
          <div className="flex-1 overflow-hidden">
            <ActivityFeed toolExecutions={currentScan.tool_executions} />
          </div>

          {/* Chat Input */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={!isRunning}
            placeholder={isRunning ? 'Type a message to the agent...' : 'Scan is not running'}
          />
        </main>
      </div>
    </div>
  );
}
