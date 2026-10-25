import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider, useAddToCartFeedback } from '@/components/cartAnim';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { TrustStrip } from '@/components/TrustStrip';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { BackToTop } from '@/components/BackToTop';
import { Newsletter } from '@/components/Newsletter';
import { Footer } from '@/components/Footer';
import { CartSheet } from '@/components/CartSheet';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';

function Shell() {
  const { bump } = useAddToCartFeedback();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Dismiss the static #app-loader once the app has painted (min 700ms so the
  // splash is perceivable, then fade out and drop the node).
  useEffect(() => {
    const wait = Math.max(0, 700 - performance.now());
    const t = window.setTimeout(() => {
      document.documentElement.classList.add('app-ready');
      window.setTimeout(() => document.getElementById('app-loader')?.remove(), 600);
    }, wait);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header bump={bump} />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <ProductGrid />
        <Testimonials />
        <FAQ />
        <Newsletter />
      </main>
      <Footer />
      <BackToTop />
      <CartSheet onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
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
