import { useMemo } from 'react';
import type { Agent } from '../types';
import { AGENT_STATUS_ICONS } from '../types';

interface AgentTreeProps {
  agents: Record<string, Agent>;
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
}

interface AgentNode extends Agent {
  children: AgentNode[];
}

export default function AgentTree({ agents, selectedAgentId, onSelectAgent }: AgentTreeProps) {
  const tree = useMemo(() => {
    const agentList = Object.values(agents);
    const nodeMap = new Map<string, AgentNode>();

    // Create nodes
    agentList.forEach((agent) => {
      nodeMap.set(agent.id, { ...agent, children: [] });
    });

    // Build tree
    const roots: AgentNode[] = [];
    nodeMap.forEach((node) => {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [agents]);

  const renderNode = (node: AgentNode, depth: number = 0) => {
    const statusIcon = AGENT_STATUS_ICONS[node.status];
    const isSelected = node.id === selectedAgentId;

    return (
      <div key={node.id}>
        <button
          onClick={() => onSelectAgent?.(node.id)}
          className={`w-full text-left px-2 py-1.5 rounded transition-colors flex items-center gap-2 ${
            isSelected
              ? 'bg-strix-border text-strix-text-primary'
              : 'hover:bg-strix-border/50 text-strix-text-secondary hover:text-strix-text-primary'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.children.length > 0 && (
            <span className="text-xs text-strix-text-muted">├─</span>
          )}
          <span className={`${node.status === 'running' ? 'animate-pulse' : ''}`}>
            {statusIcon}
          </span>
          <span className="text-sm truncate flex-1">{node.name}</span>
        </button>

        {node.children.length > 0 && (
          <div className="ml-2 border-l border-strix-border/50">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-strix-text-muted text-sm">
        No agents running
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}
