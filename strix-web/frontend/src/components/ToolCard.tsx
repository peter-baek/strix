import type { ToolExecution } from '../types';
import { TOOL_CONFIG } from '../types';

interface ToolCardProps {
  execution: ToolExecution;
}

export default function ToolCard({ execution }: ToolCardProps) {
  const config = TOOL_CONFIG[execution.tool_name] || {
    icon: '🔧',
    color: '#737373',
    label: execution.tool_name,
  };

  const getToolContent = (): { title: string; content?: string } => {
    const args = execution.args;

    switch (execution.tool_name) {
      case 'terminal_action': {
        const command = args.command as string || '';
        return {
          title: 'running command',
          content: `$ ${command}`,
        };
      }

      case 'browser_action': {
        const action = args.action as string || 'unknown';
        const url = args.url as string;
        let title = action;

        if (action === 'goto' && url) {
          title = `navigating to ${url}`;
        } else if (action === 'launch') {
          title = url ? `launching ${url}` : 'launching browser';
        } else if (action === 'type') {
          title = `typing "${(args.text as string || '').substring(0, 50)}..."`;
        } else if (action === 'click') {
          title = 'clicking element';
        } else if (action === 'screenshot') {
          title = 'taking screenshot';
        }

        return { title };
      }

      case 'python_action': {
        const code = args.code as string || '';
        return {
          title: 'executing python code',
          content: code.length > 200 ? code.substring(0, 200) + '...' : code,
        };
      }

      case 'proxy_action': {
        const proxyAction = args.action as string || '';
        if (proxyAction === 'send_request') {
          const method = args.method as string || 'GET';
          const url = args.url as string || '';
          return {
            title: 'HTTP Request',
            content: `${method} ${url}`,
          };
        }
        return { title: proxyAction };
      }

      case 'notes_action': {
        const noteAction = args.action as string || 'add';
        const content = args.content as string || '';
        return {
          title: noteAction === 'add' ? 'Adding note' : noteAction,
          content: content.length > 100 ? content.substring(0, 100) + '...' : content,
        };
      }

      case 'thinking': {
        const thought = args.thought as string || args.content as string || '';
        return {
          title: 'thinking...',
          content: thought.length > 300 ? thought.substring(0, 300) + '...' : thought,
        };
      }

      case 'web_search': {
        const query = args.query as string || '';
        return {
          title: `searching: "${query}"`,
        };
      }

      case 'file_edit': {
        const path = args.path as string || args.file_path as string || '';
        const editAction = args.action as string || 'edit';
        return {
          title: `${editAction}ing file`,
          content: path,
        };
      }

      case 'agents_graph_action': {
        const graphAction = args.action as string || '';
        if (graphAction === 'create_subagent') {
          const task = args.task as string || '';
          return {
            title: 'Creating sub-agent',
            content: task.length > 100 ? task.substring(0, 100) + '...' : task,
          };
        }
        return { title: graphAction };
      }

      case 'create_vulnerability_report': {
        const title = args.title as string || 'Vulnerability Report';
        const severity = args.severity as string || 'medium';
        return {
          title: `Creating ${severity.toUpperCase()} vulnerability report`,
          content: title,
        };
      }

      case 'finish': {
        return { title: 'Finishing scan' };
      }

      case 'scan_start_info': {
        return {
          title: 'Scan Started',
          content: JSON.stringify(args.targets || args, null, 2),
        };
      }

      case 'subagent_start_info': {
        return {
          title: 'Sub-Agent Started',
          content: args.task as string || '',
        };
      }

      default:
        return { title: execution.tool_name };
    }
  };

  const { title, content } = getToolContent();

  const getToolClass = (): string => {
    const baseClass = execution.tool_name.replace(/_/g, '-');
    const statusClass = execution.status;
    return `tool-card ${baseClass} ${statusClass}`;
  };

  return (
    <div
      className={getToolClass()}
      style={{ borderLeftColor: config.color }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{config.icon}</span>
        <span
          className="text-sm font-medium"
          style={{ color: config.color }}
        >
          {title}
        </span>
        {execution.status === 'running' && (
          <span className="text-xs text-accent-orange animate-pulse">●</span>
        )}
      </div>

      {content && (
        <pre className="mt-2 text-xs bg-strix-bg/50 rounded p-2 overflow-x-auto text-strix-text-secondary font-mono">
          {content}
        </pre>
      )}

      {execution.result && execution.status === 'completed' && (
        <div className="mt-2 text-xs text-strix-text-muted">
          <details>
            <summary className="cursor-pointer hover:text-strix-text-secondary">
              View result
            </summary>
            <pre className="mt-1 bg-strix-bg/50 rounded p-2 overflow-x-auto">
              {typeof execution.result === 'string'
                ? execution.result.substring(0, 500)
                : JSON.stringify(execution.result, null, 2).substring(0, 500)}
              {(typeof execution.result === 'string' ? execution.result : JSON.stringify(execution.result)).length > 500 && '...'}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
