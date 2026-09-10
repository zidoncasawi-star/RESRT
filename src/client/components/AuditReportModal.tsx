import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import type { QueueItem } from '../../shared/types';

type AuditReportModalProps = {
  item: QueueItem | null;
  onClose: () => void;
  onPublishNow: (item: QueueItem) => void;
};

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ item, onClose, onPublishNow }) => {
  if (!item) return null;

  const report = item.lastAuditReport;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-base text-gray-900">Pre-flight Compliance Report</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div>
              <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold block">
                Target Subreddit
              </span>
              <span className="text-sm font-bold text-gray-900">{item.subreddit}</span>
            </div>
            {report && (
              <div className="text-right">
                <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold block">
                  Score
                </span>
                <span className="text-base font-extrabold text-gray-900">{report.score}/100</span>
              </div>
            )}
            <div>
              <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold block">
                Overall Status
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  item.auditStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.auditStatus === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : item.auditStatus === 'BLOCK'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {item.auditStatus || 'UNCHECKED'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-xs">
            <span className="font-bold text-gray-700 block mb-1">Post Title:</span>
            <p className="font-medium text-gray-900">{item.title}</p>
          </div>

          {report && report.checks.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {report.checks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white border border-gray-200 shadow-2xs space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{check.name}</span>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded ${
                        check.verdict === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : check.verdict === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {check.verdict}
                    </span>
                  </div>
                  <p className="text-gray-700">{check.message}</p>
                  {check.details && <p className="text-2xs text-gray-400 mt-0.5">{check.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic text-center py-4">
              Detailed breakdown is not cached. Run a fresh audit to inspect specific check items.
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onPublishNow(item);
            }}
            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs"
          >
            Proceed to Publish
          </button>
        </div>
      </div>
    </div>
  );
};
