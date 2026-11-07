import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/cartAnim';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { TrustStrip } from '@/components/TrustStrip';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { BackToTop } from '@/components/BackToTop';
import { Newsletter } from '@/components/Newsletter';
import { Footer } from '@/components/Footer';
const ProductGrid = lazy(() => import('@/components/catalog/ProductGrid').then(m => ({ default: m.ProductGrid })));

const CartSheet = lazy(() => import('@/components/CartSheet').then(m => ({ default: m.CartSheet })));
const CheckoutDialog = lazy(() => import('@/components/checkout/CheckoutDialog').then(m => ({ default: m.CheckoutDialog })));

function Shell() {
  const { open: cartOpen } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Reveal the store as soon as React is ready.
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.documentElement.classList.add('app-ready');
      window.setTimeout(() => document.getElementById('app-loader')?.remove(), 600);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">رفتن به محتوای اصلی</a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        <TrustStrip />
        <Suspense fallback={<section id="products" className="mx-auto min-h-96 max-w-6xl px-4 py-16"><p role="status" className="text-center text-sm text-muted-foreground">در حال آماده‌سازی محصولات…</p></section>}>
          <ProductGrid />
        </Suspense>
        <Testimonials />
        <FAQ />
        <Newsletter />
      </main>
      <Footer />
      <BackToTop />
      <Suspense fallback={null}>
        {cartOpen && <CartSheet onCheckout={() => setCheckoutOpen(true)} />}
        {checkoutOpen && <CheckoutDialog open onOpenChange={setCheckoutOpen} />}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ToastProvider>
          <CartProvider>
            <AuthProvider>
              <Shell />
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
