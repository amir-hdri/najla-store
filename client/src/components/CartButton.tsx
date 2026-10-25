import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatNumber } from '@/lib/format';

export function CartButton({ bump = 0 }: { bump?: number }) {
  const { cart, setOpen } = useCart();
  const controls = useAnimation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void controls.start({
      scale: [1, 1.18, 1],
      transition: { duration: 0.35, ease: 'easeOut' },
    });
  }, [bump, controls]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="tap relative"
      aria-label={`سبد خرید، ${formatNumber(cart.totalItems)} کالا`}
      onClick={() => setOpen(true)}
    >
      <motion.span animate={controls} className="inline-flex">
        <ShoppingBag className="size-5" aria-hidden />
      </motion.span>
      {cart.totalItems > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >
          {formatNumber(cart.totalItems)}
        </span>
      )}
    </Button>
  );
}
