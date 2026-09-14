import { motion } from 'motion/react';
import { Search, X, ArrowDownUp, CheckCheck } from 'lucide-react';
import { FilterStatus, SortOption } from '../lib/types';

interface TaskFilterBarProps {
  filter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  counts: { all: number; active: number; completed: number };
  onClearCompleted: () => void;
}

export function TaskFilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  counts,
  onClearCompleted,
}: TaskFilterBarProps) {
  const tabs: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="space-y-3">
      {/* Search and Sort row */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-tasks-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-150"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="relative shrink-0 flex items-center">
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="sort-tasks-select"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort tasks"
              className="bg-transparent outline-hidden cursor-pointer text-slate-700 dark:text-slate-200 font-medium pr-1"
            >
              <option value="newest" className="dark:bg-slate-900">Newest</option>
              <option value="oldest" className="dark:bg-slate-900">Oldest</option>
              <option value="alphabetical" className="dark:bg-slate-900">A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs and Clear Completed */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl">
          {tabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                id={`filter-${tab.id}`}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`relative px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                  isActive
                    ? 'text-indigo-600 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="filterPill"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 px-1.5 py-0.2 rounded-full text-xs ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {counts.completed > 0 && (
          <button
            id="clear-completed-button"
            type="button"
            onClick={onClearCompleted}
            aria-label="Clear completed tasks"
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Clear done ({counts.completed})</span>
          </button>
        )}
      </div>
    </div>
  );
}
