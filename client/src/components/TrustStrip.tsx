import { PackageCheck, ShieldCheck, Truck } from 'lucide-react';

const items = [
  {
    icon: Truck,
    title: 'ارسال به سراسر ایران',
    text: 'رایگان از ۵۰۰٬۰۰۰ تومان',
  },
  {
    icon: PackageCheck,
    title: 'بسته‌بندی با دقت',
    text: 'محافظ طعم و کیفیت محصول',
  },
  {
    icon: ShieldCheck,
    title: 'خرید با خیال راحت',
    text: 'مشاهدهٔ جزئیات پیش از انتخاب',
  },
];
export function TrustStrip() {
  return (
    <section
      id="why"
      aria-label="مزایای خرید از نجلا"
      className="border-y border-border bg-card"
    >
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:grid-cols-3 md:px-6">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 sm:justify-center"
          >
            <item.icon
              className="size-6 shrink-0 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            <div>
              <h2 className="!font-sans text-sm font-bold">{item.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
