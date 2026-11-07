import { ArrowLeft, Gift, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-heading" className="hero-section">
      <div className="hero-layout mx-auto max-w-6xl px-4 md:px-6">
        <div className="hero-copy">
          <p className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
            <Leaf className="size-4" aria-hidden /> خرما و فرآورده‌های خرما، به
            انتخاب نجلا
          </p>
          <h1
            id="hero-heading"
            className="font-display text-[3.4rem] leading-[1.1] sm:text-6xl lg:text-[4.75rem]"
          >
            طعم اصیل خرما،
            <br />
            برای لحظه‌های شما.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-8 text-muted-foreground sm:text-base">
            از خرمای روزانه کنار چای تا یک هدیهٔ به‌یادماندنی؛ طعم دلخواه‌تان را
            از میان انتخاب‌های نجلا پیدا کنید.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded-xl px-6" asChild>
              <a href="#products">
                انتخاب و خرید خرما <ArrowLeft className="size-4" aria-hidden />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl bg-card px-5"
              asChild
            >
              <a href="#products?category=gifts">
                <Gift className="size-4" aria-hidden /> جعبه‌های هدیه
              </a>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/8 text-primary">
              <Leaf className="size-4" aria-hidden />
            </span>
            <p>
              انتخاب برای هر سلیقه
              <br />
              <span className="text-foreground">
                ممتاز، روزانه و فرآورده‌های خرما
              </span>
            </p>
          </div>
        </div>
        <figure className="hero-figure">
          <img
            src="/images/brand/najla-hero.webp"
            alt="بستهٔ خرمای نجلا در کنار خرمای تازه"
            width={600}
            height={750}
            fetchPriority="high"
            decoding="async"
            className="hero-image"
          />
          <figcaption className="hero-caption">
            <span className="font-display text-3xl">یک انتخاب خوش‌طعم</span>
            <span className="text-xs text-cream/80">
              برای پذیرایی، برای هدیه، برای خودتان
            </span>
          </figcaption>
          <span className="hero-seal" aria-hidden>
            <Leaf className="size-5" /> انتخاب
            <br />
            نجلا
          </span>
        </figure>
      </div>
    </section>
  );
}
