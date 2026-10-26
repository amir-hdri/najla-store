import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowLeft, Leaf, PackageCheck, Sparkles, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const bullets = [
  { icon: Leaf, text: 'چیده‌شده در فصل' },
  { icon: PackageCheck, text: 'بسته‌بندی هدیه' },
  { icon: Sparkles, text: 'منتخب نخلستان‌ها' },
] as const;

const stats = [
  { value: 15, suffix: '', label: 'رقم منتخب' },
  { value: 100, suffix: '٪', label: 'طبیعی و تازه' },
  { value: 3, suffix: '', label: 'ضمانت خرید' },
] as const;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString('fa-IR')}
      {suffix}
    </span>
  );
}

function RevealLine({ children, delay }: { children: ReactNode; delay: number }) {
  const reduce = useReducedMotion();

  if (reduce) return <span className="block">{children}</span>;

  return (
    <span className="block overflow-hidden pb-[0.34em] -mb-[0.34em]">
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.72, ease: EASE_OUT, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 700], [0, -54]);
  const cardY = useTransform(scrollY, [0, 700], [0, -96]);
  const badgeY = useTransform(scrollY, [0, 700], [0, -28]);

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border/60"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute -left-40 top-10 size-[28rem] rounded-full border border-gold/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-24 size-[20rem] rounded-full border border-gold/10"
        aria-hidden
      />
      <div
        className="animate-drift-a pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-gold/15 blur-3xl"
        aria-hidden
      />
      <div
        className="animate-drift-b pointer-events-none absolute -left-32 -top-16 size-[26rem] rounded-full bg-olive/15 blur-3xl"
        aria-hidden
      />
      <div
        className="animate-drift-b pointer-events-none absolute right-1/4 top-1/3 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-24 lg:gap-16">
        <motion.div
          initial={reduce ? undefined : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
            <span className="kicker-line h-px w-8" aria-hidden />
            فروشگاه تخصصی خرما و میوه
          </p>

          <h1
            id="hero-heading"
            className="font-display text-[3.35rem] leading-[1.02] sm:text-6xl lg:text-7xl"
          >
            <RevealLine delay={0.1}>خرمای تازه،</RevealLine>
            <RevealLine delay={0.19}>از نخلستان تا</RevealLine>
            <RevealLine delay={0.28}>
              <span className="relative inline-block">
                <span className="text-gradient-honey relative z-10">سفره‌ی شما</span>
                <span
                  className="absolute inset-x-0 bottom-1 z-0 h-2.5 rounded-full bg-gradient-to-l from-gold/40 to-primary/25"
                  aria-hidden
                />
              </span>
            </RevealLine>
          </h1>

          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.5 }}
          >
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
              مجموعه‌ی منتخب نخل‌داری‌های ایران؛ کیفیت درجه‌یک، بسته‌بندی شیک و تضمین
              تازگی، برای لحظه‌هایی که باید به‌یاد بمانند.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                asChild
                className="shine h-12 rounded-full bg-gradient-to-l from-primary to-primary/85 px-7 text-sm shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[.98]"
              >
                <a href="#products">
                  <ArrowLeft className="ml-1 size-4" aria-hidden />
                  مشاهده‌ی محصولات
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-border bg-card/60 px-7 text-sm backdrop-blur active:scale-[.98]"
              >
                <a href="#why">چرا نجلا؟</a>
              </Button>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs font-medium text-muted-foreground sm:text-sm">
              {bullets.map(b => (
                <li key={b.text} className="flex items-center gap-1.5">
                  <b.icon className="size-4 text-gold" aria-hidden />
                  {b.text}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.dl
            initial={reduce ? undefined : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.62 }}
            className="mt-9 grid max-w-md grid-cols-3 border-t border-border/70 pt-6"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={
                  index > 0
                    ? 'border-r border-border/70 px-4 text-center'
                    : 'px-4 text-center'
                }
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl leading-none text-foreground">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
                <dd className="mt-2 text-[11px] font-medium text-muted-foreground sm:text-xs">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
          className="relative mx-auto mb-8 w-full max-w-md md:mb-0"
        >
          <div
            className="absolute -inset-3 rounded-t-[13rem] rounded-b-[2.5rem] border border-gold/25"
            aria-hidden
          />
          <motion.div style={reduce ? undefined : { y: imageY }}>
            <motion.figure
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-t-[12rem] rounded-b-[2rem] border-[6px] border-card shadow-warm">
                <img
                  src="/images/brand/najla-hero.webp"
                  alt="تصویر برند نجلا از محصولات منتخب"
                  className="aspect-[4/5] w-full object-cover"
                  width={600}
                  height={750}
                  fetchPriority="high"
                  decoding="async"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-espresso/5 to-transparent"
                  aria-hidden
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-6 text-cream">
                  <span className="text-[10px] font-semibold tracking-[0.28em] text-gold">
                    مجموعه‌ی امسال
                  </span>
                  <p className="mt-1 font-display text-3xl leading-none">منتخب نجلا</p>
                  <p className="mt-2 text-xs text-cream/75">از نخلستان تا سفره‌ی شما</p>
                </figcaption>
              </div>
            </motion.figure>
          </motion.div>

          <motion.div
            className="absolute -bottom-8 right-2 w-60 md:-right-6"
            style={reduce ? undefined : { y: cardY }}
            aria-hidden
          >
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 22 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.55 }}
              className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-warm backdrop-blur"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                <img
                  src="/images/brand/najla-product.webp"
                  alt=""
                  className="warm-photo size-full object-cover"
                  width={148}
                  height={200}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-gold">پرفروش‌ترین</p>
                <p className="truncate text-sm font-bold">خرمای مجول</p>
                <p className="mt-0.5 text-xs font-black text-primary">۸۴۹٬۰۰۰ تومان</p>
              </div>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <ArrowLeft className="size-4" />
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute -top-3 left-4 md:-left-4"
            style={reduce ? undefined : { y: badgeY }}
            aria-hidden
          >
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: -12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.45 }}
              className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur"
            >
              <Truck className="size-3.5 text-gold" />
              ارسال به سراسر ایران
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
