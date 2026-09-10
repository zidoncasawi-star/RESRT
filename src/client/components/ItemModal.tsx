import React, { useState } from 'react';
import { X, Send, Save, ShieldCheck } from 'lucide-react';
import type { PostType, QueueItem } from '../../shared/types';

type ItemModalProps = {
  item: QueueItem | null;
  mode: 'view' | 'edit';
  onClose: () => void;
  onSave: (updated: Partial<QueueItem>) => Promise<void>;
  onAudit: (item: QueueItem) => void;
  onPublish: (item: QueueItem) => Promise<void>;
};

type ItemModalInnerProps = {
  item: QueueItem;
  mode: 'view' | 'edit';
  onClose: () => void;
  onSave: (updated: Partial<QueueItem>) => Promise<void>;
  onAudit: (item: QueueItem) => void;
  onPublish: (item: QueueItem) => Promise<void>;
};

const ItemModalInner: React.FC<ItemModalInnerProps> = ({
  item,
  mode,
  onClose,
  onSave,
  onAudit,
  onPublish,
}) => {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [subreddit, setSubreddit] = useState(item.subreddit);
  const [postType, setPostType] = useState<PostType>(item.postType);
  const [flair, setFlair] = useState(item.flair || '');
  const [referenceUrl, setReferenceUrl] = useState(item.referenceUrl || '');
  const [scheduledAt, setScheduledAt] = useState(item.scheduledAt || '');
  const [status, setStatus] = useState<QueueItem['status']>(item.status);
  const [isSaving, setIsSaving] = useState(false);

  const isViewOnly = mode === 'view';

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave({
      id: item.id,
      title,
      body,
      subreddit,
      postType,
      flair: flair.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
      scheduledAt: scheduledAt || undefined,
      status,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base text-gray-900">
              {isViewOnly ? 'Submission Details' : 'Edit Submission'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-semibold">
              {item.subreddit}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Subreddit</label>
            <input
              type="text"
              disabled={isViewOnly}
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Title</label>
            <input
              type="text"
              disabled={isViewOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-semibold disabled:bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Post Type</label>
              <select
                disabled={isViewOnly}
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 disabled:bg-gray-50"
              >
                <option value="Discussion">Discussion</option>
                <option value="Question">Question</option>
                <option value="Experience">Experience</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Case Study">Case Study</option>
                <option value="Announcement">Announcement</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Status</label>
              <select
                disabled={isViewOnly}
                value={status}
                onChange={(e) => setStatus(e.target.value as QueueItem['status'])}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 disabled:bg-gray-50"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="QUEUED">QUEUED</option>
                <option value="READY">READY</option>
                <option value="PAUSED">PAUSED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Body</label>
            <textarea
              rows={6}
              disabled={isViewOnly}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono disabled:bg-gray-50 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Schedule Time</label>
              <input
                type="datetime-local"
                disabled={isViewOnly}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 disabled:bg-gray-50 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Flair</label>
              <input
                type="text"
                disabled={isViewOnly}
                value={flair}
                onChange={(e) => setFlair(e.target.value)}
                placeholder="Optional"
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 disabled:bg-gray-50 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Reference URL (Optional)</label>
            <input
              type="url"
              disabled={isViewOnly}
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 disabled:bg-gray-50 text-xs"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onAudit(item)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Check Pre-flight Status
          </button>

          <div className="flex items-center space-x-2">
            {!isViewOnly && (
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save Changes
              </button>
            )}
            <button
              type="button"
              onClick={() => onPublish(item)}
              className="inline-flex items-center px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ItemModal: React.FC<ItemModalProps> = (props) => {
  if (!props.item) return null;
  return <ItemModalInner key={props.item.id} {...props} item={props.item} />;
};
