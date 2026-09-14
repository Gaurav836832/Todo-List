import React, { useState, useRef } from 'react';
import { Plus, Sparkles, CornerDownLeft } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (title: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

const QUICK_SUGGESTIONS = [
  'Plan tomorrow priorities',
  'Review emails & inbox zero',
  'Drink 2L water today',
  '30 min focused walk',
];

export function TaskInput({ onAddTask, isSubmitting = false }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    setTitle('');
    await onAddTask(trimmed);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTitle(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full space-y-2.5">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          id="new-task-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What would you like to accomplish today?"
          maxLength={200}
          disabled={isSubmitting}
          className="w-full text-base sm:text-lg pl-4 pr-24 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {title.trim().length > 0 && (
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline select-none">
              {200 - title.length}
            </span>
          )}

          <button
            id="add-task-button"
            type="submit"
            disabled={!title.trim() || isSubmitting}
            aria-label="Add task"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add</span>
            <CornerDownLeft className="w-3 h-3 opacity-60 hidden sm:inline" />
          </button>
        </div>
      </form>

      {/* Quick suggestions chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 shrink-0 font-medium text-slate-400 dark:text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Quick:
        </span>
        {QUICK_SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
