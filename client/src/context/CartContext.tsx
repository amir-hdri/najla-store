import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { CartAPI, PromoAPI } from '@/lib/api';
import type { Cart, PromoInfo } from '@/lib/types';

interface CartValue {
  cart: Cart;
  open: boolean;
  setOpen(v: boolean): void;
  add(productId: number, qty?: number): Promise<void>;
  update(itemId: number, qty: number): Promise<void>;
  remove(itemId: number): Promise<void>;
  clear(): Promise<void>;
  promo: PromoInfo | null;
  setPromo(p: PromoInfo | null): void;
  refresh(): Promise<void>;
  loading: boolean;
  pending: boolean;
  lastError: string | null;
  setLastError(msg: string | null): void;
}

const EMPTY: Cart = { items: [], totalItems: 0, subtotal: 0 };
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [open, setOpen] = useState(false);
  const [promo, setPromo] = useState<PromoInfo | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { cart: c } = await CartAPI.get();
      setCart(c);
      setLastError(null);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'خطایی رخ داد.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback((fn: () => Promise<{ cart: Cart }>) => {
    setPendingCount(count => count + 1);
    const operation = queue.current.then(async () => {
      try {
        const { cart: updated } = await fn();
        setCart(updated);
        setLastError(null);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'خطایی رخ داد.');
        throw e;
      } finally {
        setPendingCount(count => count - 1);
      }
    });
    queue.current = operation.catch(() => undefined);
    return operation;
  }, []);

  const add = useCallback(
    async (productId: number, qty = 1) => run(() => CartAPI.add(productId, qty)),
    [run],
  );
  const update = useCallback(
    async (itemId: number, qty: number) => run(() => CartAPI.update(itemId, qty)),
    [run],
  );
  const remove = useCallback(
    async (itemId: number) => run(() => CartAPI.remove(itemId)),
    [run],
  );
  const clear = useCallback(async () => {
    await run(() => CartAPI.clear());
    setPromo(null);
  }, [run]);

  const setPromoSafe = useCallback((p: PromoInfo | null) => {
    setPromo(p);
    setLastError(null);
  }, []);

  // Re-validate the stored promo when the subtotal changes; drop it when invalid.
  const promoCode = promo?.code ?? null;
  useEffect(() => {
    if (!promoCode) return;
    if (cart.subtotal <= 0) {
      setPromo(null);
      return;
    }
    let cancelled = false;
    PromoAPI.validate(promoCode, cart.subtotal)
      .then(({ promo: fresh }) => {
        if (cancelled) return;
        setPromo(prev =>
          prev &&
          prev.code === fresh.code &&
          prev.discount === fresh.discount &&
          prev.freeShip === fresh.freeShip
            ? prev
            : fresh,
        );
      })
      .catch(() => {
        if (!cancelled) setPromo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [promoCode, cart.subtotal]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      pending: pendingCount > 0,
      open,
      setOpen,
      add,
      update,
      remove,
      clear,
      promo,
      setPromo: setPromoSafe,
      refresh,
      lastError,
      setLastError,
    }),
    [cart, loading, pendingCount, open, add, update, remove, clear, promo, setPromoSafe, refresh, lastError],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
