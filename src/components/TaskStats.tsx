import { motion } from 'motion/react';
import { CheckCircle2, ListTodo } from 'lucide-react';

interface TaskStatsProps {
  total: number;
  completed: number;
}

export function TaskStats({ total, completed }: TaskStatsProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const getEncouragement = () => {
    if (total === 0) return 'Your slate is clean. What will you conquer today?';
    if (percentage === 100) return 'Outstanding work! Everything is done 🎉';
    if (percentage >= 75) return 'Almost at the finish line! Keep going 🔥';
    if (percentage >= 50) return 'Halfway there, steady momentum! ⚡';
    if (percentage > 0) return 'Great start! One step at a time.';
    return 'Ready when you are. Pick your first focus!';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Daily Progress
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {getEncouragement()}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <ListTodo className="w-4 h-4 text-slate-400" />
            <span>{total - completed} active</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completed} done</span>
          </div>
        </div>
      </div>

      {/* Progress Bar with smooth transition */}
      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
