import { useRef, useEffect } from 'react';
import type { ToolExecution } from '../types';
import ToolCard from './ToolCard';

interface ActivityFeedProps {
  toolExecutions: Record<string, ToolExecution>;
}

export default function ActivityFeed({ toolExecutions }: ActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Sort by execution ID (chronological order)
  const sortedExecutions = Object.values(toolExecutions).sort(
    (a, b) => a.id - b.id
  );

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [toolExecutions]);

  // Handle scroll to toggle auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If user scrolled up more than 100px from bottom, disable auto-scroll
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  if (sortedExecutions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-strix-text-muted">
        <div className="text-center">
          <div className="text-4xl mb-2">🦉</div>
          <p className="text-sm">Waiting for activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto p-4 space-y-2"
    >
      {sortedExecutions.map((execution) => (
        <ToolCard key={execution.id} execution={execution} />
      ))}
    </div>
  );
}
