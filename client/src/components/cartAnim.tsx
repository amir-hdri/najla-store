import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
}

interface ToastValue {
  toast(message: string): void;
  toasts: ToastItem[];
  dismiss(id: number): void;
}

const ToastContext = createContext<ToastValue | null>(null);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string) => {
      const id = nextId++;
      setToasts(ts => [...ts, { id, message }]);
      window.setTimeout(() => dismiss(id), 2800);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, toasts, dismiss }), [toast, toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-lg"
              role="status"
            >
              <CheckCircle2 className="size-4 text-primary" aria-hidden />
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** Shared "add to cart" feedback: toast + badge bump. The bump is exposed as
 *  a counter the CartButton watches via useBumpKey. */
export function useAddToCartFeedback() {
  const { toast } = useToast();
  const [bump, setBump] = useState(0);

  const feedback = useCallback(
    (productName?: string) => {
      setBump(n => n + 1);
      toast(productName ? `«${productName}» به سبد اضافه شد` : 'به سبد اضافه شد');
    },
    [toast],
  );

  return { feedback, bump };
}
