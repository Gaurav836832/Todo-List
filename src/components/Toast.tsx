import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, Undo2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onUndo?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-xl border border-slate-700/50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {toast.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onUndo?.();
                    onDismiss(toast.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo
                </button>
              )}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Close notification"
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
