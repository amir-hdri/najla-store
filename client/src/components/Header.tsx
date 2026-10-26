import { useState } from 'react';
import { motion, useScroll } from 'framer-motion';
import { ArrowLeft, Menu, Package, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CartButton } from '@/components/CartButton';
import { BrandMark } from '@/components/BrandMark';
import { ThemeToggle } from '@/components/ThemeToggle';
import { lazy, Suspense } from 'react';
import { AuthDialog } from '@/components/auth/AuthDialog';

const AccountDialog = lazy(() => import('@/components/account/AccountDialog').then(m => ({ default: m.AccountDialog })));
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { href: '#products', label: 'محصولات' },
  { href: '#why', label: 'چرا نجلا؟' },
  { href: '#newsletter', label: 'خبرنامه' },
];

export function Header({ bump }: { bump: number }) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  function openAccount() {
    setMenuOpen(false);
    if (user) setAccountOpen(true);
    else setAuthOpen(true);
  }

  return (
    <>
      <div className="bg-espresso text-cream">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-medium sm:text-xs">
          <Truck className="size-3.5 shrink-0 text-gold" aria-hidden />
          <span>ارسال رایگان برای سفارش‌های بالای ۵۰۰٬۰۰۰ تومان</span>
          <span className="hidden h-3 w-px bg-cream/20 sm:block" aria-hidden />
          <span className="hidden text-cream/65 sm:inline">تازه، مستقیم از نخلستان</span>
        </p>
      </div>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:h-20 md:px-6">
          <a
            href="#top"
            className="tap flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <BrandMark size="sm" animated />
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl leading-none md:text-[1.7rem]">نجلا</span>
              <span className="mt-1 text-[9px] font-semibold tracking-[0.32em] text-muted-foreground">
                NAJLA
              </span>
            </span>
            <span className="sr-only">نجلا — فروشگاه خرما و میوه</span>
          </a>

          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative px-3 py-2 text-sm font-medium text-foreground/70 transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-primary after:transition-transform hover:text-foreground hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="tap hidden sm:inline-flex"
              aria-label="سفارش‌های من"
              title="سفارش‌های من"
              onClick={() => (user ? setAccountOpen(true) : setAuthOpen(true))}
            >
              <Package className="size-5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="tap hidden sm:inline-flex"
              aria-label={user ? `حساب ${user.name}` : 'حساب کاربری'}
              title={user ? user.name : 'حساب کاربری'}
              onClick={openAccount}
            >
              <User className="size-5" aria-hidden />
            </Button>
            <CartButton bump={bump} />
            <Button
              variant="ghost"
              size="icon"
              className="tap md:hidden"
              aria-label="باز کردن منو"
              title="منو"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </div>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-[86%] max-w-xs gap-0 border-s-0 bg-background p-0"
          >
            <SheetHeader className="border-b border-border/70 p-6 text-start">
              <SheetTitle className="flex items-center gap-3">
                <BrandMark size="sm" />
                <span className="flex flex-col leading-none">
                  <span className="font-display text-2xl">نجلا</span>
                  <span className="mt-1 text-[9px] font-semibold tracking-[0.32em] text-muted-foreground">
                    NAJLA
                  </span>
                </span>
              </SheetTitle>
              <SheetDescription className="pt-2 text-sm leading-6 text-muted-foreground">
                خرما و میوه خشک، از نخلستان تا سفره شما.
              </SheetDescription>
            </SheetHeader>

            <nav aria-label="ناوبری موبایل" className="flex flex-col p-3">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  {item.label}
                  <ArrowLeft className="size-4 text-muted-foreground" aria-hidden />
                </a>
              ))}
            </nav>

            <div className="mt-auto space-y-3 border-t border-border/70 p-6">
              <Button className="tap h-11 w-full" onClick={openAccount}>
                {user ? 'حساب کاربری' : 'ورود / ثبت‌نام'}
              </Button>
              <Button
                variant="outline"
                className="tap h-11 w-full"
                onClick={() => {
                  setMenuOpen(false);
                  if (user) setAccountOpen(true);
                  else setAuthOpen(true);
                }}
              >
                <Package className="size-4" aria-hidden />
                سفارش‌های من
              </Button>
              <p className="text-center text-xs leading-6 text-muted-foreground">
                تازه، طبیعی و بدون واسطه
              </p>
            </div>
          </SheetContent>
        </Sheet>

        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        <Suspense fallback={null}>
          <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
        </Suspense>

        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-right bg-gradient-to-l from-gold via-gold to-primary"
          aria-hidden
        />
      </header>
    </>
  );
}
