import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listScans } from '../api/client';
import type { ScanSummary } from '../types';

export default function ScanHistory() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScans = async () => {
      try {
        const result = await listScans();
        setScans(result.scans);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scans');
      } finally {
        setIsLoading(false);
      }
    };

    loadScans();
  }, []);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running':
        return 'bg-accent-green/20 text-accent-green';
      case 'completed':
        return 'bg-accent-green/20 text-accent-green';
      case 'failed':
        return 'bg-accent-red/20 text-accent-red';
      case 'stopped':
        return 'bg-accent-orange/20 text-accent-orange';
      default:
        return 'bg-strix-border text-strix-text-secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🦉</div>
          <p className="text-strix-text-secondary">Loading scans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-strix-text-primary">Scan History</h1>
        <Link
          to="/new"
          className="px-4 py-2 bg-accent-green hover:bg-accent-green/90 text-strix-bg font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          🚀 New Scan
        </Link>
      </div>

      {error && (
        <div className="bg-accent-red/20 border border-accent-red/50 rounded-lg p-3 text-sm text-accent-red mb-4">
          {error}
        </div>
      )}

      {scans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🦉</div>
          <h2 className="text-lg font-semibold text-strix-text-primary mb-2">
            No scans yet
          </h2>
          <p className="text-strix-text-secondary mb-6">
            Start your first security scan to see it here
          </p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green hover:bg-accent-green/90 text-strix-bg font-semibold rounded-lg transition-colors"
          >
            🚀 Start First Scan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="bg-strix-surface border border-strix-border rounded-lg p-4 hover:border-strix-border/80 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/scan/${scan.id}`}
                      className="text-lg font-semibold text-strix-text-primary hover:text-accent-green transition-colors"
                    >
                      {scan.name || scan.id}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(scan.status)}`}>
                      {scan.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-strix-text-secondary">
                    <span>Started: {formatDate(scan.started_at)}</span>
                    {scan.completed_at && (
                      <span>Completed: {formatDate(scan.completed_at)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent-yellow">{scan.agents_count}</div>
                    <div className="text-xs text-strix-text-muted">Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent-red">{scan.vulnerabilities_count}</div>
                    <div className="text-xs text-strix-text-muted">Vulns</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-strix-border">
                <Link
                  to={`/scan/${scan.id}`}
                  className="text-sm text-accent-green hover:text-accent-green/80 transition-colors"
                >
                  View Details →
                </Link>
                {scan.vulnerabilities_count > 0 && (
                  <Link
                    to={`/scan/${scan.id}/vulnerabilities`}
                    className="text-sm text-accent-orange hover:text-accent-orange/80 transition-colors"
                  >
                    View Reports →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
