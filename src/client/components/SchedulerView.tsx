import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Send,
  Edit,
  Globe,
  Info,
} from 'lucide-react';
import type { QueueItem } from '../../shared/types';

type SchedulerViewProps = {
  items: QueueItem[];
  onEditItem: (item: QueueItem) => void;
  onPublishNow: (item: QueueItem) => void;
  onOpenNewDraft: () => void;
};

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  items,
  onEditItem,
  onPublishNow,
  onOpenNewDraft,
}) => {
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  const scheduledItems = items
    .filter((i) => i.scheduledAt && (i.status === 'QUEUED' || i.status === 'READY'))
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
            <span>Submission Scheduler</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure delivery windows for prepared community submissions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 font-medium">Timezone:</span>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="text-xs rounded-md border border-gray-300 py-1 px-2 bg-white text-gray-800"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">US Eastern (ET)</option>
            <option value="America/Chicago">US Central (CT)</option>
            <option value="America/Los_Angeles">US Pacific (PT)</option>
            <option value="Europe/London">Europe / London</option>
            <option value="Europe/Berlin">Europe / Berlin</option>
            <option value="Asia/Tokyo">Asia / Tokyo</option>
          </select>
        </div>
      </div>

      {/* Compliance / Transparent scheduling info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Standard Scheduled Publishing</p>
          <p className="text-blue-800">
            All schedules execute according to your configured timetable. The publisher does not introduce randomized delays or stealth evasions. Always ensure your posting frequency adheres to each subreddit's guidelines.
          </p>
        </div>
      </div>

      {/* Timeline of Scheduled Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Upcoming Scheduled Queue</h3>
          <button
            type="button"
            onClick={onOpenNewDraft}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Schedule New
          </button>
        </div>

        {scheduledItems.length > 0 ? (
          <div className="space-y-3 pt-2">
            {scheduledItems.map((item, idx) => {
              const dateObj = new Date(item.scheduledAt!);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-orange-50/40 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                          {item.subreddit}
                        </span>
                        <span className="text-2xs text-gray-500">• {item.postType}</span>
                        <span className="text-2xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mt-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        Target: {dateObj.toLocaleDateString()} at{' '}
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({selectedTimezone})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md"
                    >
                      <Edit className="w-3 h-3 inline mr-1" /> Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => onPublishNow(item)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-2xs"
                    >
                      <Send className="w-3 h-3 inline mr-1" /> Publish Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-600">No upcoming scheduled submissions</p>
            <p className="mt-1">Add items to the queue with a scheduled date and time to view them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
