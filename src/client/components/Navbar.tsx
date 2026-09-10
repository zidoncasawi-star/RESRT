import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ListOrdered,
  Calendar,
  Sparkles,
  ShieldCheck,
  History,
  Settings,
  Plus,
  Radio,
} from 'lucide-react';
import type { CampaignStats } from '../../shared/types';

export type TabKey =
  | 'dashboard'
  | 'drafts'
  | 'queue'
  | 'scheduler'
  | 'writer'
  | 'auditor'
  | 'audit-logs'
  | 'settings';

type NavbarProps = {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenNewDraft: () => void;
  username: string;
  subredditName: string;
  stats: CampaignStats | null;
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewDraft,
  username,
  subredditName,
  stats,
}) => {
  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: number | undefined }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      key: 'drafts',
      label: 'Drafts',
      icon: <FileText className="w-4 h-4" />,
      badge: stats?.draftsCount,
    },
    {
      key: 'queue',
      label: 'Publishing Queue',
      icon: <ListOrdered className="w-4 h-4" />,
      badge: stats?.queuedCount,
    },
    { key: 'scheduler', label: 'Scheduler', icon: <Calendar className="w-4 h-4" /> },
    { key: 'writer', label: 'AI Writer', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { key: 'auditor', label: 'Pre-flight Audit', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'audit-logs', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900 tracking-tight">Reddit Publisher</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Devvit
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Transparent & Compliant Community Publishing Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
              <span className="font-medium text-gray-900">{subredditName}</span>
              <span className="text-gray-300">•</span>
              <span>u/{username}</span>
            </div>

            <button
              id="nav-new-draft-btn"
              type="button"
              onClick={onOpenNewDraft}
              className="inline-flex items-center px-3.5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-xs text-white bg-orange-600 hover:bg-orange-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={`tab-${item.key}`}
                type="button"
                onClick={() => onSelectTab(item.key)}
                className={`flex items-center whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-1.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-orange-200 text-orange-900' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
