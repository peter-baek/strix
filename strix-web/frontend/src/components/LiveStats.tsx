import type { LiveStats as LiveStatsType } from '../types';

interface LiveStatsProps {
  stats: LiveStatsType;
  status?: string;
}

export default function LiveStats({ stats, status }: LiveStatsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}`;
  };

  const statItems = [
    { label: 'Agents', value: stats.agents, color: 'text-accent-yellow' },
    { label: 'Tools', value: stats.tools, color: 'text-accent-cyan' },
    { label: 'Tokens', value: formatNumber(stats.tokens), color: 'text-accent-blue' },
    { label: 'Cost', value: formatCost(stats.cost), color: 'text-accent-green' },
  ];

  return (
    <div className="bg-strix-surface border border-strix-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-strix-text-secondary">Live Stats</h3>
        {status && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            status === 'running' ? 'bg-accent-green/20 text-accent-green animate-pulse' :
            status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
            status === 'failed' ? 'bg-accent-red/20 text-accent-red' :
            'bg-strix-border text-strix-text-secondary'
          }`}>
            {status.toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`text-lg font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-xs text-strix-text-muted">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
