import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 600,
  );
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          initial={reduce ? undefined : { opacity: 0, y: 12, scale: 0.9 }}
          animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={scrollTop}
          aria-label="بازگشت به بالای صفحه"
          title="بازگشت به بالا"
          className="fixed bottom-6 right-4 z-40 grid size-11 place-items-center rounded-full border border-border/80 bg-card/95 text-primary shadow-warm backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:right-6"
        >
          <ArrowUp className="size-5" aria-hidden />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
