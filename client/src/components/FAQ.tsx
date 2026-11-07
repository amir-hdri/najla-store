import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ShoppingBag } from 'lucide-react';

const FAQS = [
  {
    q: 'هزینهٔ ارسال چقدر است؟',
    a: 'هزینهٔ ارسال سفارش‌های کمتر از ۵۰۰٬۰۰۰ تومان، ۴۹٬۰۰۰ تومان است؛ از این مبلغ به بالا، ارسال رایگان محاسبه می‌شود. هزینهٔ نهایی پیش از ثبت سفارش نمایش داده می‌شود.',
  },
  {
    q: 'مشخصات و وزن محصولات را کجا ببینم؟',
    a: 'با انتخاب هر محصول، توضیحات طعم، وزن بسته، قیمت و وضعیت موجودی آن را می‌بینید. برای نگهداری، به راهنمای روی بسته توجه کنید.',
  },
  {
    q: 'چه روش‌های پرداختی دارید؟',
    a: 'در حال حاضر پرداخت در محل قابل انتخاب است و مبلغ هنگام تحویل دریافت می‌شود. درگاه پرداخت آنلاین هنوز فعال نیست.',
  },
  {
    q: 'بسته‌بندی هدیه دارید؟',
    a: 'بله؛ محصولات دستهٔ «جعبه‌های هدیه» را انتخاب کنید و نشانی گیرنده را در مرحلهٔ تکمیل سفارش وارد کنید.',
  },
  {
    q: 'برای خرید باید حساب کاربری داشته باشم؟',
    a: 'خرید مهمان هم امکان‌پذیر است. با حساب کاربری می‌توانید نشانی‌ها را ذخیره کنید و سفارش‌های ثبت‌شده با همان حساب را ببینید. در خرید مهمان، شمارهٔ سفارش را نگه دارید.',
  },
  {
    q: 'به خارج از ایران هم ارسال می‌کنید؟',
    a: 'در حال حاضر، ثبت سفارش و ارسال در این فروشگاه فقط برای نشانی‌های داخل ایران است.',
  },
];

export function FAQ() {
  const reduce = useReducedMotion();

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20"
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
            پیش از خرید، روش پرداخت، هزینهٔ ارسال و جزئیات انتخاب محصول را اینجا ببینید.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-xs font-medium text-muted-foreground">
            <ShoppingBag className="size-4 text-primary" aria-hidden />
            قیمت و موجودی، پیش از ثبت نهایی مشخص است
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
