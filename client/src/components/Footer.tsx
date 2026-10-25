import { Leaf, Mail, ShieldCheck, Truck } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const PERSIAN_YEAR = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());

const QUICK_LINKS = [
  { href: '#products', label: 'محصولات' },
  { href: '#why', label: 'چرا نجلا؟' },
  { href: '#reviews', label: 'نظرات مشتریان' },
  { href: '#faq', label: 'سوالات متداول' },
  { href: '#newsletter', label: 'خبرنامه' },
];

export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-espresso text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1.2fr] md:px-6">
        <div>
          <p className="flex items-center gap-3">
            <BrandMark size="md" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl leading-none">نجلا</span>
              <span className="mt-1 text-[9px] font-semibold tracking-[0.32em] text-cream/45">
                NAJLA
              </span>
            </span>
          </p>
          <p className="mt-5 max-w-xs text-sm leading-7 text-cream/55">
            خرمای اصیل، انتخاب دقیق، بسته‌بندی شیک. از دل باغ تا در خانه‌ی شما.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-cream/55">
            <li className="flex items-center gap-1.5">
              <Leaf className="size-3.5 text-gold" aria-hidden />
              طبیعی و تازه
            </li>
            <li className="flex items-center gap-1.5">
              <Truck className="size-3.5 text-gold" aria-hidden />
              ارسال سراسری
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-gold" aria-hidden />
              تضمین کیفیت
            </li>
          </ul>
        </div>

        <nav aria-label="دسترسی سریع">
          <p className="text-xs font-semibold text-gold">دسترسی سریع</p>
          <ul className="mt-4 space-y-3 text-sm text-cream/60">
            {QUICK_LINKS.map(link => (
              <li key={link.href}>
                <a
                  className="transition-colors hover:text-cream focus-visible:text-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold text-gold">ارتباط با ما</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-cream/60" dir="ltr">
            <Mail className="size-4 text-gold" aria-hidden />
            <span className="font-mono text-xs">hello@najla.local</span>
          </p>
          <p className="mt-3 text-sm leading-7 text-cream/60">
            پاسخگویی: شنبه تا چهارشنبه، ۹ تا ۱۸
          </p>
          <p className="mt-4 text-[11px] leading-6 text-cream/40">
            سفارش‌ها پس از تأیید، در روزهای کاری بسته‌بندی و ارسال می‌شوند.
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-[11px] text-cream/40 sm:flex-row md:px-6">
          <p>© {PERSIAN_YEAR} نجلا — تمامی حقوق محفوظ است.</p>
          <p>تمام قیمت‌ها به تومان است.</p>
        </div>
      </div>
    </footer>
  );
}
