import React from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Send,
  Trash2,
  Edit,
  Plus,
} from 'lucide-react';
import type { QueueItem } from '../../shared/types';

type DraftsViewProps = {
  items: QueueItem[];
  onEditItem: (item: QueueItem) => void;
  onAuditItem: (item: QueueItem) => void;
  onDeleteItem: (item: QueueItem) => void;
  onPublishNow: (item: QueueItem) => void;
  onOpenNewDraft: () => void;
};

export const DraftsView: React.FC<DraftsViewProps> = ({
  items,
  onEditItem,
  onAuditItem,
  onDeleteItem,
  onPublishNow,
  onOpenNewDraft,
}) => {
  const drafts = items.filter((i) => i.status === 'DRAFT');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Content Drafts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Prepare, refine, and test submissions in a safe workspace before scheduling.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewDraft}
          className="inline-flex items-center px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Draft
        </button>
      </div>

      {drafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((draft) => {
            const auditVerdict = draft.auditStatus || 'UNCHECKED';
            const auditScore = draft.lastAuditReport?.score ?? null;

            return (
              <div
                key={draft.id}
                className="bg-white rounded-xl border border-gray-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-800">
                      {draft.subreddit}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        auditVerdict === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : auditVerdict === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : auditVerdict === 'BLOCK'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Audit: {auditVerdict} {auditScore !== null ? `(${auditScore}%)` : ''}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">
                    {draft.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {draft.body}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-2xs text-gray-400">
                    <span>Type: {draft.postType}</span>
                    <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onEditItem(draft)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-xs font-medium"
                        title="Edit Draft"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAuditItem(draft)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md text-xs font-medium"
                        title="Pre-flight Audit"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(draft)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md text-xs font-medium"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPublishNow(draft)}
                      className="inline-flex items-center px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Send className="w-3 h-3 mr-1" /> Publish
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No content drafts saved</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Use the AI Writer to generate structured Reddit submissions or compose your drafts manually.
          </p>
          <button
            type="button"
            onClick={onOpenNewDraft}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 shadow-xs"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" /> Open AI Writer
          </button>
        </div>
      )}
    </div>
  );
};
