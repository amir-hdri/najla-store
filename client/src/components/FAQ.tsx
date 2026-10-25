import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, MessagesSquare } from 'lucide-react';

const FAQS = [
  {
    q: 'سفارش چقدر طول می‌کشد به دستم برسد؟',
    a: 'تهران و مراکز استان ۱ تا ۲ روز کاری، سایر شهرها ۲ تا ۴ روز کاری. برای سفارش‌های بالای ۵۰۰٬۰۰۰ تومان ارسال رایگان است.',
  },
  {
    q: 'تازگی محصول چطور تضمین می‌شود؟',
    a: 'خرما و میوه‌ها در همان فصل برداشت می‌شوند و در روز برداشت بسته‌بندی می‌گردند. تاریخ برداشت روی هر جعبه درج شده است.',
  },
  {
    q: 'چه روش‌های پرداختی دارید؟',
    a: 'پرداخت آنلاین از طریق درگاه امن بانکی، و پرداخت در محل برای شهرهای منتخب. اطلاعات پرداخت شما نزد ما ذخیره نمی‌شود.',
  },
  {
    q: 'بسته‌بندی هدیه دارید؟',
    a: 'بله؛ جعبه‌های هدیه با کارت پیام اختصاصی در مرحله‌ی تسویه‌حساب قابل انتخاب هستند و بدون فاکتور قیمت، مستقیم به گیرنده ارسال می‌شوند.',
  },
  {
    q: 'اگر راضی نباشم، مرجوعی چطور است؟',
    a: 'تا ۷ روز پس از تحویل، اگر از کیفیت راضی نبودید، بسته را همان‌طور که رسیده نگه دارید و با پشتیبانی تماس بگیرید؛ بدون دردسر پیگیری می‌کنیم.',
  },
  {
    q: 'به خارج از ایران هم ارسال می‌کنید؟',
    a: 'فعلاً ارسال فقط داخل ایران انجام می‌شود، اما نسخه‌ی بین‌المللی فروشگاه به‌زودی راه‌اندازی می‌شود.',
  },
];

export function FAQ() {
  const reduce = useReducedMotion();

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 md:px-6 md:pb-20"
    >
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="kicker-line h-px w-8" aria-hidden />
            سوالات متداول
          </p>
          <h2 id="faq-heading" className="font-display text-4xl md:text-5xl">
            هر سوالی دارید،
            <span className="block">اینجا جواب دارد</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
            پرتکرارترین پرسش‌های خریداران نجلا. اگر جواب سوال‌تان اینجا نبود،
            تیم پشتیبانی شنبه تا چهارشنبه، ۹ تا ۱۸ پاسخگوی شماست.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-xs font-medium text-muted-foreground">
            <MessagesSquare className="size-4 text-gold" aria-hidden />
            پشتیبانی: hello@najla.local
          </p>
        </motion.div>

        <ul className="list-none space-y-3 p-0">
          {FAQS.map((item, index) => (
            <motion.li
              key={item.q}
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.06 }}
            >
              <details className="group rounded-2xl border border-border/80 bg-card transition-colors duration-200 hover:border-primary/30 open:border-primary/30 open:bg-card [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-bold leading-7 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                  {item.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:bg-primary/10 group-open:text-primary">
                    <ChevronDown className="size-4" aria-hidden />
                  </span>
                </summary>
                <p className="faq-answer px-5 pb-5 text-sm leading-7 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
