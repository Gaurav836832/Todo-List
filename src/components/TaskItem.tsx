import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Trash2, Edit2, X, Clock } from 'lucide-react';
import { Task } from '../lib/types';

interface TaskItemProps {
  key?: React.Key;
  task: Task;
  onToggle: (id: string, currentCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  soundEnabled: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  soundEnabled,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed);
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  // Format created time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <motion.li
      id={`task-item-${task.id}`}
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.95, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
        task.completed
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400 dark:text-slate-500'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/60'
      }`}
    >
      {/* Custom Animated Checkbox */}
      <button
        id={`task-toggle-${task.id}`}
        type="button"
        onClick={() => onToggle(task.id, task.completed)}
        aria-label={task.completed ? 'Mark task as active' : 'Mark task as completed'}
        className={`relative shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 cursor-pointer ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/50 dark:bg-slate-800/50'
        }`}
      >
        <motion.span
          initial={false}
          animate={{
            scale: task.completed ? 1 : 0,
            opacity: task.completed ? 1 : 0,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </motion.span>
      </button>

      {/* Task Content / Inline Edit */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              id={`task-edit-input-${task.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              maxLength={200}
              className="w-full text-base font-medium px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded-lg outline-hidden text-slate-900 dark:text-white ring-2 ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save changes"
              className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditTitle(task.title);
                setIsEditing(false);
              }}
              aria-label="Cancel editing"
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span
              onDoubleClick={() => setIsEditing(true)}
              className={`text-base font-medium break-words select-none cursor-pointer transition-all duration-200 ${
                task.completed
                  ? 'line-through decoration-slate-400 dark:decoration-slate-600 text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
              title="Double click to edit"
            >
              {task.title}
            </span>

            {task.created_at && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 shrink-0 select-none">
                <Clock className="w-3 h-3" />
                {formatTime(task.created_at)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons (visible on hover / focus) */}
      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            id={`task-edit-btn-${task.id}`}
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit task ${task.title}`}
            title="Edit task"
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            id={`task-delete-btn-${task.id}`}
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete task ${task.title}`}
            title="Delete task"
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.li>
  );
}
