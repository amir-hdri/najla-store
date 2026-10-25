import { motion, useReducedMotion } from 'framer-motion';
import { Leaf, ShieldCheck, Truck } from 'lucide-react';

const items = [
  {
    icon: Leaf,
    title: 'تازگی از باغ',
    text: 'هر بسته همان‌فصل چیده و بسته‌بندی می‌شود؛ بدون انبار طولانی.',
  },
  {
    icon: Truck,
    title: 'ارسال سریع',
    text: 'بسته‌بندی مقاوم و ارسال به سراسر کشور، با پیگیری سفارش.',
  },
  {
    icon: ShieldCheck,
    title: 'تضمین کیفیت',
    text: 'اگر راضی نبودید، بازگشت بدون دردسر؛ خیال‌تان راحت باشد.',
  },
] as const;

const numbers = ['۰۱', '۰۲', '۰۳'];

export function TrustStrip() {
  const reduce = useReducedMotion();

  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="relative overflow-hidden bg-espresso text-cream"
    >
      <div
        className="pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-0 size-[26rem] rounded-full border border-cream/[0.06]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-gold">
              <span className="h-px w-8 bg-gold/50" aria-hidden />
              چرا نجلا؟
            </p>
            <h2
              id="why-heading"
              className="font-display text-4xl leading-[1.1] text-cream md:text-5xl"
            >
              خریدی که
              <span className="block text-cream/90">خیال‌تان را راحت می‌کند</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-cream/60 lg:justify-self-end lg:text-base lg:leading-8">
            از انتخاب نخلستان تا بسته‌بندی و ارسال، هر مرحله را خودمان انجام می‌دهیم
            تا آنچه به دست‌تان می‌رسد، همان چیزی باشد که انتظار دارید.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-cream/10 bg-cream/10 sm:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group bg-espresso p-6 transition-colors hover:bg-cream/[0.035] md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-full border border-gold/25 bg-gold/[0.07] text-gold transition-colors group-hover:border-gold/45">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-4xl leading-none text-cream/15">
                  {numbers[index]}
                </span>
              </div>
              <h3 className="mt-8 font-display text-2xl text-cream">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-cream/60">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
