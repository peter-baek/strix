import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVulnerabilities } from '../api/client';
import type { Vulnerability, Severity } from '../types';

export default function Vulnerabilities() {
  const { scanId } = useParams<{ scanId: string }>();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  useEffect(() => {
    if (!scanId) return;

    const loadVulnerabilities = async () => {
      try {
        const result = await getVulnerabilities(scanId);
        setVulnerabilities(result.vulnerabilities);
        setSummary(result.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vulnerabilities');
      } finally {
        setIsLoading(false);
      }
    };

    loadVulnerabilities();
  }, [scanId]);

  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
  });

  const getSeverityStyle = (severity: Severity): string => {
    switch (severity) {
      case 'critical':
        return 'bg-severity-critical/20 text-severity-critical border-severity-critical';
      case 'high':
        return 'bg-severity-high/20 text-severity-high border-severity-high';
      case 'medium':
        return 'bg-severity-medium/20 text-severity-medium border-severity-medium';
      case 'low':
        return 'bg-severity-low/20 text-severity-low border-severity-low';
      case 'info':
        return 'bg-severity-info/20 text-severity-info border-severity-info';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🦉</div>
          <p className="text-strix-text-secondary">Loading vulnerabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              to={`/scan/${scanId}`}
              className="text-strix-text-secondary hover:text-strix-text-primary transition-colors"
            >
              ← Back to Scan
            </Link>
            <span className="text-strix-text-muted">|</span>
            <h1 className="text-xl font-bold text-strix-text-primary">Vulnerability Reports</h1>
          </div>

          {/* Summary */}
          <div className="bg-strix-surface border border-strix-border rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-strix-text-secondary mb-3">Summary</h2>
            <div className="flex items-center gap-6">
              {severityOrder.map((severity) => (
                <div key={severity} className="text-center">
                  <div className={`text-2xl font-bold ${
                    severity === 'critical' ? 'text-severity-critical' :
                    severity === 'high' ? 'text-severity-high' :
                    severity === 'medium' ? 'text-severity-medium' :
                    severity === 'low' ? 'text-severity-low' :
                    'text-severity-info'
                  }`}>
                    {summary[severity] || 0}
                  </div>
                  <div className="text-xs text-strix-text-muted capitalize">{severity}</div>
                </div>
              ))}
              <div className="border-l border-strix-border pl-6 text-center">
                <div className="text-2xl font-bold text-strix-text-primary">
                  {vulnerabilities.length}
                </div>
                <div className="text-xs text-strix-text-muted">Total</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-accent-red/20 border border-accent-red/50 rounded-lg p-3 text-sm text-accent-red mb-4">
              {error}
            </div>
          )}

          {/* Vulnerability List */}
          {vulnerabilities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-semibold text-strix-text-primary mb-2">
                No vulnerabilities found
              </h2>
              <p className="text-strix-text-secondary">
                Great news! The scan didn't find any security issues.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVulnerabilities.map((vuln) => (
                <div
                  key={vuln.id}
                  onClick={() => setSelectedVuln(vuln)}
                  className={`bg-strix-surface border-l-4 rounded-r-lg p-4 cursor-pointer hover:bg-strix-border/20 transition-colors ${getSeverityStyle(vuln.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`severity-badge ${vuln.severity}`}>
                        {vuln.severity}
                      </span>
                      <span className="text-xs text-strix-text-muted">{vuln.id}</span>
                    </div>
                    <span className="text-xs text-strix-text-muted">
                      {new Date(vuln.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-strix-text-primary mb-2">
                    {vuln.title}
                  </h3>
                  <p className="text-sm text-strix-text-secondary line-clamp-2">
                    {vuln.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedVuln && (
        <div className="w-1/2 border-l border-strix-border bg-strix-surface overflow-y-auto">
          <div className="sticky top-0 bg-strix-surface border-b border-strix-border p-4 flex items-center justify-between">
            <h2 className="font-semibold text-strix-text-primary">Vulnerability Details</h2>
            <button
              onClick={() => setSelectedVuln(null)}
              className="text-strix-text-muted hover:text-strix-text-primary transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className={`severity-badge ${selectedVuln.severity}`}>
                {selectedVuln.severity}
              </span>
              <span className="text-sm text-strix-text-muted">{selectedVuln.id}</span>
            </div>

            <h3 className="text-xl font-bold text-strix-text-primary mb-4">
              {selectedVuln.title}
            </h3>

            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-strix-text-secondary bg-strix-bg rounded-lg p-4 overflow-x-auto">
                {selectedVuln.content}
              </pre>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(selectedVuln.content)}
                className="px-3 py-1.5 text-sm bg-strix-border hover:bg-strix-border/80 text-strix-text-primary rounded transition-colors"
              >
                Copy Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
