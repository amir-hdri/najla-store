import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  city: string;
  rating: number;
  text: string;
  tag: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'سارا محمدی',
    city: 'تهران',
    rating: 5,
    text: 'خرمای مجول فوق‌العاده تازه بود و بسته‌بندی هدیه خیلی شیک. برای عید به همه‌ی فامیل سفارش دادم و همه تعریف کردند.',
    tag: 'خرمای مجول',
  },
  {
    name: 'امیر رضایی',
    city: 'شیراز',
    rating: 5,
    text: 'سفارش دو روزه رسید و بسته‌بندی کاملاً محکم بود. خرما دقیقاً همان چیزی بود که در عکس‌ها دیده می‌شد؛ بدون هیچ تفاوتی.',
    tag: 'جعبه هدیه',
  },
  {
    name: 'مریم کاظمی',
    city: 'مشهد',
    rating: 4,
    text: 'پشتیبانی با حوصله به سوال‌هایم جواب داد و ارسال هم سریع بود. تنها نکته اینکه ای‌کاش تنوع خرمای خشک بیشتر می‌شد.',
    tag: 'خرمای ربی',
  },
];

const faNumber = new Intl.NumberFormat('fa-IR');

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`امتیاز ${faNumber.format(rating)} از ۵`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? 'size-3.5 fill-gold text-gold'
              : 'size-3.5 text-border'
          }
          aria-hidden
        />
      ))}
    </span>
  );
}

export function Testimonials() {
  const reduce = useReducedMotion();

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative mx-auto max-w-6xl scroll-mt-24 overflow-x-clip px-4 py-16 md:px-6 md:py-20"
    >
      <div
        className="animate-drift-b pointer-events-none absolute -left-40 top-1/4 -z-10 size-[26rem] rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="kicker-line h-px w-8" aria-hidden />
            نظرات مشتریان
          </p>
          <h2 id="reviews-heading" className="font-display text-4xl md:text-5xl">
            خریداران چه می‌گویند؟
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            تجربه‌ی واقعی کسانی که از نجلا خرید کرده‌اند؛ بدون ویرایش، بدون اغراق.
          </p>
        </div>
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium">
          <span className="flex items-center gap-0.5" aria-hidden>
            <Star className="size-4 fill-gold text-gold" />
            <span className="font-black tabular-nums">۴٫۹</span>
          </span>
          <span className="text-muted-foreground">
            از ۵ · بر اساس دیدگاه خریداران
          </span>
        </p>
      </div>

      <ul className="mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
        {TESTIMONIALS.map((t, index) => (
          <motion.li
            key={t.name}
            initial={reduce ? undefined : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <figure className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgb(36_24_18/0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-warm dark:shadow-[0_1px_2px_rgb(0_0_0/0.25)]">
              <div className="flex items-center justify-between gap-3">
                <Stars rating={t.rating} />
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {t.tag}
                </span>
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-7 text-foreground/85">
                «{t.text}»
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary"
                  aria-hidden
                >
                  {t.name.trim()[0]}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-bold">{t.name}</span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    خریدار تأییدشده · {t.city}
                  </span>
                </span>
              </figcaption>
            </figure>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
