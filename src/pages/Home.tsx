import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  CheckSquare2,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  Inbox,
  CheckCircle,
  Share2,
  ExternalLink,
  Copy,
  Download,
} from 'lucide-react';
import { Task, FilterStatus, SortOption } from '../lib/types';
import * as api from '../lib/api';
import { playTaskCompleteSound, playTaskUncheckSound, playAddSound } from '../lib/sound';
import { TaskItem } from '../components/TaskItem';
import { TaskInput } from '../components/TaskInput';
import { TaskStats } from '../components/TaskStats';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { ToastContainer, ToastMessage } from '../components/Toast';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('taskflow_sound') !== 'false';
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('taskflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('taskflow_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('taskflow_sound', String(next));
      return next;
    });
  };

  const SHORT_APP_URL = 'https://tinyurl.com/277znpgb';

  const handleCopyShortUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SHORT_APP_URL).catch(() => {});
    }
    addToast({
      type: 'success',
      message: 'Simple link copied: tinyurl.com/277znpgb',
    });
  };

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load tasks on mount
  const loadTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const fetched = await api.fetchTasks();
      setTasks(fetched);
      setIsBackendConnected(true);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setIsBackendConnected(false);
      addToast({
        type: 'error',
        message: 'Could not connect to live server. Displaying local tasks.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Confetti trigger
  const fireCelebration = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#6366f1'],
      });
    } catch {
      // ignore
    }
  };

  // Track pending creations and ID mappings
  const pendingCreationsRef = useRef<Map<string, Promise<Task>>>(new Map());
  const tempToRealIdRef = useRef<Map<string, string>>(new Map());

  const resolveRealTaskId = async (id: string): Promise<string | null> => {
    if (tempToRealIdRef.current.has(id)) {
      return tempToRealIdRef.current.get(id)!;
    }
    if (pendingCreationsRef.current.has(id)) {
      try {
        const created = await pendingCreationsRef.current.get(id)!;
        return created.id;
      } catch {
        return null;
      }
    }
    return id;
  };

  // Add Task (Optimistic)
  const handleAddTask = async (title: string) => {
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newTask: Task = {
      id: tempId,
      title,
      completed: false,
      created_at: new Date().toISOString(),
    };

    // Instant optimistic update
    setTasks((prev) => [newTask, ...prev]);
    playAddSound(soundEnabled);

    const createPromise = api.createTask({ title });
    pendingCreationsRef.current.set(tempId, createPromise);

    try {
      const created = await createPromise;
      tempToRealIdRef.current.set(tempId, created.id);
      pendingCreationsRef.current.delete(tempId);

      // Replace temp task with server returned task, preserving any interim completion toggle
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? { ...created, completed: t.completed, title: t.title }
            : t
        )
      );

      // If user toggled or edited while creating, sync the changes to server now
      setTasks((latest) => {
        const matching = latest.find((t) => t.id === created.id);
        if (matching && (matching.completed !== created.completed || matching.title !== created.title)) {
          api.updateTask(created.id, {
            completed: matching.completed,
            title: matching.title,
          }).catch(console.error);
        }
        api.saveLocalCache(latest);
        return latest;
      });

      setIsBackendConnected(true);
    } catch (error) {
      pendingCreationsRef.current.delete(tempId);
      console.error('Failed to create task:', error);
      // Revert optimistic task
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      addToast({
        type: 'error',
        message: 'Failed to save task to backend. Please try again.',
      });
    }
  };

  // Toggle Task Completion (Optimistic)
  const handleToggleTask = async (id: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;

    // Play tactile sound
    if (newCompleted) {
      playTaskCompleteSound(soundEnabled);
    } else {
      playTaskUncheckSound(soundEnabled);
    }

    // Optimistic state
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    );

    // Check if this action completed all tasks
    const otherIncomplete = tasks.filter(
      (t) => t.id !== id && !t.completed
    ).length;
    if (newCompleted && otherIncomplete === 0 && tasks.length > 0) {
      fireCelebration();
      addToast({
        type: 'success',
        message: 'All tasks completed! Fantastic job! 🎉',
      });
    }

    const realId = await resolveRealTaskId(id);
    if (!realId) {
      return;
    }

    try {
      await api.updateTask(realId, { completed: newCompleted });
      setIsBackendConnected(true);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      const isNotFound = error?.status === 404 || error?.message?.includes('404');
      if (isNotFound) {
        // Task no longer exists on the server, remove it gracefully from UI and cache
        setTasks((prev) => {
          const updated = prev.filter((t) => t.id !== id && t.id !== realId);
          api.saveLocalCache(updated);
          return updated;
        });
        addToast({
          type: 'info',
          message: 'Task no longer exists on server.',
        });
        return;
      }

      // Revert optimistic state for general network error
      setTasks((prev) =>
        prev.map((t) => (t.id === id || t.id === realId ? { ...t, completed: currentCompleted } : t))
      );
      addToast({
        type: 'error',
        message: 'Failed to update task on backend.',
      });
    }
  };

  // Edit Task Title (Optimistic)
  const handleEditTask = async (id: string, newTitle: string) => {
    const original = tasks.find((t) => t.id === id);
    if (!original) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );

    const realId = await resolveRealTaskId(id);
    if (!realId) return;

    try {
      await api.updateTask(realId, { title: newTitle });
      addToast({
        type: 'info',
        message: 'Task updated',
      });
      setIsBackendConnected(true);
    } catch (error: any) {
      console.error('Failed to update task title:', error);
      const isNotFound = error?.status === 404 || error?.message?.includes('404');
      if (isNotFound) {
        setTasks((prev) => {
          const updated = prev.filter((t) => t.id !== id && t.id !== realId);
          api.saveLocalCache(updated);
          return updated;
        });
        addToast({
          type: 'info',
          message: 'Task no longer exists on server.',
        });
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === id || t.id === realId ? { ...t, title: original.title } : t))
      );
      addToast({
        type: 'error',
        message: 'Failed to update task title.',
      });
    }
  };

  // Delete Task (Optimistic with Undo)
  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== id));

    let undone = false;

    // Toast with Undo option
    addToast({
      type: 'info',
      message: `Deleted "${taskToDelete.title.substring(0, 20)}${
        taskToDelete.title.length > 20 ? '...' : ''
      }"`,
      onUndo: async () => {
        undone = true;
        // Restore locally
        setTasks((prev) => [taskToDelete, ...prev]);
        try {
          // Recreate on backend
          await api.createTask({ title: taskToDelete.title });
        } catch {
          // Keep locally
        }
      },
    });

    const realId = await resolveRealTaskId(id);
    if (!realId) return;

    // Background server call
    try {
      if (!undone) {
        await api.deleteTask(realId);
        setIsBackendConnected(true);
      }
    } catch (error: any) {
      if (!undone) {
        const isNotFound = error?.status === 404 || error?.message?.includes('404');
        if (isNotFound) {
          // If already not on server, consider delete successful
          return;
        }
        console.error('Failed to delete task on server:', error);
        // If delete fails, restore
        setTasks((prev) => [taskToDelete, ...prev]);
        addToast({
          type: 'error',
          message: 'Could not delete task from server.',
        });
      }
    }
  };

  // Clear all completed tasks
  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    // Optimistic removal
    setTasks((prev) => prev.filter((t) => !t.completed));

    addToast({
      type: 'info',
      message: `Cleared ${completedTasks.length} completed ${
        completedTasks.length === 1 ? 'task' : 'tasks'
      }`,
      onUndo: () => {
        setTasks((prev) => [...prev, ...completedTasks]);
      },
    });

    // Delete concurrently in backend
    try {
      await Promise.all(
        completedTasks.map(async (t) => {
          const realId = await resolveRealTaskId(t.id);
          if (realId) {
            try {
              await api.deleteTask(realId);
            } catch (err: any) {
              if (err?.status !== 404 && !err?.message?.includes('404')) {
                throw err;
              }
            }
          }
        })
      );
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Some completed tasks could not be deleted from server:', err);
    }
  };

  // Filter & Sort Tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by tab
    if (filter === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      }
      if (sortOption === 'oldest') {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      }
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [tasks, filter, searchQuery, sortOption]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <CheckSquare2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  TaskFlow
                </h1>
                {/* Live Backend Connection Indicator */}
                <span
                  title={
                    isBackendConnected
                      ? 'Connected to live backend (https://beginner-todo-1.preview.emergentagent.com)'
                      : 'Offline fallback mode'
                  }
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Live Cloud</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Smooth, focused daily task management
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Refresh Live Tasks */}
            <button
              id="refresh-tasks-button"
              type="button"
              onClick={() => loadTasks(true)}
              aria-label="Refresh tasks from server"
              title="Sync with cloud backend"
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>

            {/* Audio Feedback Toggle */}
            <button
              id="sound-toggle-button"
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              title={soundEnabled ? 'Tactile sound: ON' : 'Tactile sound: OFF'}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Share / Copy Simple Link */}
            <button
              id="share-short-link-button"
              type="button"
              onClick={handleCopyShortUrl}
              aria-label="Copy simple link"
              title="Copy simple link (tinyurl.com/277znpgb)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Download Complete ZIP */}
            <a
              id="download-zip-button"
              href="/taskflow-complete.zip"
              download="taskflow-complete.zip"
              aria-label="Download project ZIP"
              title="Download complete project ZIP"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ZIP</span>
            </a>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-button"
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
              className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Task Creation Box */}
        <TaskInput onAddTask={handleAddTask} />

        {/* Progress & Stats Card */}
        <TaskStats total={counts.all} completed={counts.completed} />

        {/* Filters, Search & Sort */}
        <TaskFilterBar
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOption={sortOption}
          onSortChange={setSortOption}
          counts={counts}
          onClearCompleted={handleClearCompleted}
        />

        {/* Task List Section */}
        <main className="space-y-3">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-2.5 py-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredAndSortedTasks.length > 0 ? (
            <ul id="task-list" className="space-y-2.5 list-none p-0 m-0">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredAndSortedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    soundEnabled={soundEnabled}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            /* Empty States */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40"
            >
              {searchQuery ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    No tasks found
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    No tasks match &ldquo;{searchQuery}&rdquo;. Try another search term.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    Clear search
                  </button>
                </>
              ) : filter === 'completed' ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-3 text-indigo-500">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    No completed tasks yet
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Finish active tasks by ticking the circle checkbox to see them here.
                  </p>
                </>
              ) : filter === 'active' && counts.all > 0 ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-3 text-emerald-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    All tasks completed!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    You have cleared your active to-do list. Take a breather or add another focus.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
                    <CheckSquare2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    Your day is clear!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Type a task above or use a quick suggestion to organize your day.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </main>

        {/* Footer info & Shorthand link reminder */}
        <footer className="pt-4 pb-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span>TaskFlow</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Live FastAPI
            </span>
            <span>•</span>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-slate-600 dark:text-slate-300">
              <a
                href={SHORT_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
              >
                tinyurl.com/277znpgb
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleCopyShortUrl}
                title="Copy link"
                className="p-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <span>•</span>
            <a
              href="/taskflow-complete.zip"
              download="taskflow-complete.zip"
              title="Download source code ZIP"
              className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Download className="w-3 h-3" />
              <span>Download ZIP</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">Enter ↵</kbd> to add</span>
            <span>•</span>
            <span>Double click to edit</span>
          </div>
        </footer>
      </div>

      {/* Floating Toast Notification Center */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
