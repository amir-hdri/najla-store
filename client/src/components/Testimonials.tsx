import { ArrowLeft, Coffee, Gift, Sprout } from 'lucide-react';

const choices = [
  {
    icon: Coffee,
    title: 'همراه هر روز',
    text: 'خرماهای روزانه برای کنار چای، صبحانه و میان‌وعده.',
    category: 'classic',
    link: 'خرماهای روزانه',
  },
  {
    icon: Sprout,
    title: 'کشف طعم‌های تازه',
    text: 'از شیرهٔ خرما تا خرمای شکلاتی و شکم‌پر؛ یک انتخاب متفاوت.',
    category: 'craft',
    link: 'فرآورده‌های خرما',
  },
  {
    icon: Gift,
    title: 'هدیه‌ای با سلیقه',
    text: 'جعبه‌های منتخب خرما برای پذیرایی و مناسبت‌های خاص.',
    category: 'gifts',
    link: 'جعبه‌های هدیه',
  },
];
export function Testimonials() {
  return (
    <section
      id="reviews"
      aria-labelledby="guide-heading"
      className="bg-secondary/50"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <h2 id="guide-heading" className="font-display text-4xl md:text-5xl">
          برای چه لحظه‌ای انتخاب می‌کنید؟
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          یک راهنمای کوتاه برای پیدا کردن طعم دلخواه شما.
        </p>
        <div className="mt-8 grid gap-7 md:grid-cols-3">
          {choices.map((item) => (
            <a
              key={item.category}
              href={`#products?category=${item.category}`}
              className="group border-t border-primary/20 pt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <item.icon
                className="size-7 text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
              <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-7 text-muted-foreground">
                {item.text}
              </p>
              <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                {item.link}
                <ArrowLeft
                  className="size-4 transition-transform group-hover:-translate-x-1"
                  aria-hidden
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
