import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getScanReport, getScan } from '../api/client';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DownloadMenu from '../components/DownloadMenu';

type Tab = 'full' | 'vulnerabilities';

export default function Reports() {
  const { scanId } = useParams<{ scanId: string }>();
  const { t } = useTranslation(['vulnerability', 'scan']);
  const [activeTab, setActiveTab] = useState<Tab>('full');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [scanName, setScanName] = useState<string | null>(null);
  const [runName, setRunName] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [scanId]);

  const loadReport = async () => {
    if (!scanId) return;

    try {
      setLoading(true);
      setError(null);

      // Load scan details
      const scanData = await getScan(scanId);
      setScanName(scanData.name || scanId);

      // Load report
      const reportData = await getScanReport(scanId);
      setReport(reportData.report);
      setVulnerabilities(reportData.vulnerabilities);
      setRunName(reportData.run_name);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-gray-400">Loading report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl text-red-500 mb-2">Failed to Load Report</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <Link
            to="/scans"
            className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Back to Scans
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'full', label: t('vulnerability:report.fullReport'), icon: '📋' },
    { id: 'vulnerabilities', label: `${t('vulnerability:title')} (${vulnerabilities.length})`, icon: '🐛' },
  ];

  return (
    <div className="h-full flex flex-col bg-strix-bg">
      {/* Header */}
      <div className="border-b border-strix-border bg-strix-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-strix-text-primary mb-1">
              {t('vulnerability:report.title')}
            </h1>
            <div className="text-sm text-gray-400">
              {scanName && <span className="mr-4">Scan: {scanName}</span>}
              {runName && <span>Run: {runName}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {scanId && <DownloadMenu scanId={scanId} runName={runName || undefined} />}
            <Link
              to={`/scans/${scanId}`}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Back to Scan
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'full' && report && (
          <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-8 border border-gray-800">
            <MarkdownRenderer content={report} />
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {vulnerabilities.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-xl text-green-500 mb-2">
                  {t('vulnerability:noVulnerabilities')}
                </div>
                <div className="text-gray-400">
                  No security vulnerabilities were detected during the scan.
                </div>
              </div>
            ) : (
              vulnerabilities.map((vuln, index) => (
                <div
                  key={vuln.id || index}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          vuln.severity === 'critical'
                            ? 'bg-red-900 text-red-200'
                            : vuln.severity === 'high'
                            ? 'bg-orange-900 text-orange-200'
                            : vuln.severity === 'medium'
                            ? 'bg-yellow-900 text-yellow-200'
                            : vuln.severity === 'low'
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {t(`vulnerability:severity.${vuln.severity}`)}
                        </span>
                        <span className="text-xs text-gray-500">{vuln.id}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-200">
                        {vuln.title}
                      </h3>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {vuln.content}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
