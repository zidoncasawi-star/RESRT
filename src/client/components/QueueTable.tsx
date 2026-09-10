import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ShieldCheck,
  Send,
  Plus,
  ArrowUpDown,
} from 'lucide-react';
import type { QueueItem } from '../../shared/types';

type QueueTableProps = {
  items: QueueItem[];
  onViewItem: (item: QueueItem) => void;
  onEditItem: (item: QueueItem) => void;
  onAuditItem: (item: QueueItem) => void;
  onDeleteItem: (item: QueueItem) => void;
  onPublishNow: (item: QueueItem) => void;
  onOpenNewDraft: () => void;
};

export const QueueTable: React.FC<QueueTableProps> = ({
  items,
  onViewItem,
  onEditItem,
  onAuditItem,
  onDeleteItem,
  onPublishNow,
  onOpenNewDraft,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredItems = items
    .filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subreddit.toLowerCase().includes(q) ||
        item.postType.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const getStatusBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" /> QUEUED
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> READY
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> PUBLISHED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <AlertOctagon className="w-3 h-3 mr-1" /> FAILED
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            PAUSED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            CANCELLED
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileText className="w-3 h-3 mr-1" /> DRAFT
          </span>
        );
    }
  };

  const getAuditBadge = (verdict?: QueueItem['auditStatus']) => {
    switch (verdict) {
      case 'PASS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
            PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300">
            WARNING
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-300">
            BLOCK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
            UNCHECKED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Publishing Queue</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage scheduled submissions, verify pre-flight compliance, and execute user-controlled publishing.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewDraft}
          className="inline-flex items-center px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Submission
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, subreddit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
            <option value="PAUSED">Paused</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
            title="Sort by Update Time"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-gray-500" />
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Subreddit</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Post Type</th>
                  <th className="px-4 py-3">Scheduled Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pre-flight Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 font-semibold">
                        {item.subreddit}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-sm">
                      <div className="font-semibold text-gray-900 line-clamp-1">{item.title}</div>
                      {item.flair && (
                        <span className="inline-block mt-1 text-2xs px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                          flair: {item.flair}
                        </span>
                      )}
                      {item.errorMessage && (
                        <p className="text-2xs text-rose-600 mt-1 line-clamp-1">
                          Notice: {item.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{item.postType}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {item.scheduledAt ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {new Date(item.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="text-2xs text-gray-500">
                            {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onAuditItem(item)}
                        className="hover:opacity-80 transition-opacity"
                        title="Click to view full audit report"
                      >
                        {getAuditBadge(item.auditStatus)}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onViewItem(item)}
                          className="p-1.5 text-gray-500 hover:text-gray-800 rounded-md hover:bg-gray-100"
                          title="View submission details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                          title="Edit submission"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAuditItem(item)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 rounded-md hover:bg-amber-50"
                          title="Run pre-flight audit"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onPublishNow(item)}
                          className="inline-flex items-center px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
                          title="Publish now via Devvit"
                        >
                          <Send className="w-3 h-3 mr-1" /> Publish Now
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-700 font-semibold">No submissions matching filter</p>
            <p className="text-xs text-gray-500 mt-1">Try selecting another status or clearing the search query.</p>
            {statusFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-orange-600 font-semibold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
