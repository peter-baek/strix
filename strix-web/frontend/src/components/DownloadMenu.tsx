import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadReport, triggerDownload } from '../api/client';
import type { ReportFormat } from '../types';

interface DownloadMenuProps {
  scanId: string;
  runName?: string;
}

const FORMATS: { value: ReportFormat; label: string; icon: string }[] = [
  { value: 'markdown', label: 'Markdown (.md)', icon: '📝' },
  { value: 'json', label: 'JSON (.json)', icon: '📊' },
  { value: 'csv', label: 'CSV (.csv)', icon: '📈' },
  { value: 'pdf', label: 'PDF (.pdf)', icon: '📄' },
];

export default function DownloadMenu({ scanId, runName }: DownloadMenuProps) {
  const { t } = useTranslation('vulnerability');
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<ReportFormat | null>(null);

  const handleDownload = async (format: ReportFormat) => {
    try {
      setDownloading(format);
      const blob = await downloadReport(scanId, format);

      // Determine file extension
      const extensions: Record<ReportFormat, string> = {
        'markdown': 'md',
        'json': 'json',
        'csv': 'csv',
        'pdf': 'pdf',
      };

      const extension = extensions[format];
      const filename = `${runName || scanId}_report.${extension}`;

      triggerDownload(blob, filename);
      setIsOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download report: ${error}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
      >
        <span>📥</span>
        <span>{t('report.download')}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider">
                {t('report.formats.markdown')} {t('report.formats.json')} {t('report.formats.csv')} {t('report.formats.pdf')}
              </div>
              {FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleDownload(format.value)}
                  disabled={downloading === format.value}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xl">{format.icon}</span>
                  <span className="flex-1">{format.label}</span>
                  {downloading === format.value && (
                    <span className="animate-spin">⏳</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
