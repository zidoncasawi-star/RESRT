import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Clock,
  Send,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import type { AuditLogEvent } from '../../shared/types';

type AuditLogsViewProps = {
  logs: AuditLogEvent[];
  onRefresh: () => void;
};

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onRefresh }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'ALL') {
      if (filterType === 'DRAFT' && !log.eventType.startsWith('DRAFT')) return false;
      if (filterType === 'AUDIT' && !log.eventType.startsWith('AUDIT')) return false;
      if (filterType === 'QUEUE' && !log.eventType.startsWith('QUEUE')) return false;
      if (filterType === 'PUBLISH' && !log.eventType.startsWith('PUBLISH')) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(q) ||
      log.eventType.toLowerCase().includes(q) ||
      (log.subreddit && log.subreddit.toLowerCase().includes(q))
    );
  });

  const getEventBadge = (eventType: AuditLogEvent['eventType']) => {
    if (eventType.includes('PASSED') || eventType.includes('SUCCEEDED')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {eventType}
        </span>
      );
    }
    if (eventType.includes('WARNING')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3 h-3 mr-1" /> {eventType}
        </span>
      );
    }
    if (eventType.includes('BLOCKED') || eventType.includes('FAILED')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          <AlertOctagon className="w-3 h-3 mr-1" /> {eventType}
        </span>
      );
    }
    if (eventType.includes('PUBLISH_REQUESTED')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <Send className="w-3 h-3 mr-1" /> {eventType}
        </span>
      );
    }
    if (eventType.includes('QUEUE')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
          <Clock className="w-3 h-3 mr-1" /> {eventType}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
        <FileText className="w-3 h-3 mr-1" /> {eventType}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <History className="w-5 h-5 text-orange-600" />
            <span>Audit & Compliance Logs</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Transparent event log tracking all draft updates, pre-flight audits, queue state changes, and publishing actions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshClick}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs by message or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Filter Category:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Events</option>
            <option value="AUDIT">Audits (Passed/Warning/Blocked)</option>
            <option value="PUBLISH">Publishing (Requested/Succeeded/Failed)</option>
            <option value="QUEUE">Queue Updates</option>
            <option value="DRAFT">Draft Actions</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Subreddit</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Item ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-2xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getEventBadge(log.eventType)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {log.subreddit || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium max-w-md">{log.message}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-2xs whitespace-nowrap">
                      {log.itemId ? log.itemId.slice(0, 15) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400 text-xs">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No audit records matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};
