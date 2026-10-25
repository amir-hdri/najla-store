import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  lastError: string | null;
  setLastError(msg: string | null): void;
}

const EMPTY: Cart = { items: [], totalItems: 0, subtotal: 0 };
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [open, setOpen] = useState(false);
  const [promo, setPromo] = useState<PromoInfo | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { cart: c } = await CartAPI.get();
      setCart(c);
      setLastError(null);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'خطایی رخ داد.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (fn: () => Promise<{ cart: Cart }>) => {
      try {
        const { cart: c } = await fn();
        setCart(c);
        setLastError(null);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'خطایی رخ داد.');
        throw e;
      }
    },
    [],
  );

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
    [cart, open, add, update, remove, clear, promo, setPromoSafe, refresh, lastError],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
