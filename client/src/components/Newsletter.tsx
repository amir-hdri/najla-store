import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MailCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/cartAnim';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const reduce = useReducedMotion();

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 md:px-6 md:pb-20"
    >
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="rounded-[2rem] bg-gradient-to-bl from-gold/60 via-border/50 to-primary/50 p-px shadow-warm"
      >
      <div className="relative overflow-hidden rounded-[calc(2rem-1px)] border-0 bg-espresso px-6 py-10 text-cream md:px-12 md:py-14">
        <img
          src="/images/brand/najla-texture.webp"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-15"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso via-espresso/75 to-espresso/40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-gold/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-10 size-72 rounded-full border border-cream/[0.07]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-20 left-4 select-none font-display text-[14rem] leading-none text-cream/[0.035]"
          aria-hidden
        >
          ن
        </span>

        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-gold">
              <MailCheck className="size-4" aria-hidden />
              خبرنامه‌ی نجلا
            </p>
            <h2
              id="newsletter-heading"
              className="font-display text-4xl leading-[1.1] text-cream md:text-5xl"
            >
              اولین نفر از فصل برداشت
              <span className="block text-cream/85">باخبر شوید</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-cream/60">
              تخفیف‌های فصلی، محصولات تازه و داستان نخلستان‌ها؛ بدون شلوغی، فقط خبرهای
              خوب.
            </p>
          </div>

          <div className="w-full max-w-md">
            {sent ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3.5 text-sm font-medium text-cream"
              >
                <MailCheck className="size-5 shrink-0 text-gold" aria-hidden />
                عضویت شما ثبت شد؛ به‌زودی خبرهای خوب می‌رسد.
              </p>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!email.trim()) return;
                  setSent(true);
                  setEmail('');
                  toast('ایمیل شما با موفقیت ثبت شد');
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    required
                    placeholder="example@mail.com"
                    dir="ltr"
                    aria-label="ایمیل برای خبرنامه"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-11 rounded-full border-cream/15 bg-cream px-4 text-espresso placeholder:text-espresso/40 focus-visible:border-gold focus-visible:ring-gold/30"
                  />
                  <Button
                    type="submit"
                    className="h-11 shrink-0 rounded-full bg-gold px-6 text-gold-foreground shadow-none transition-colors hover:bg-gold/90 active:scale-[.98]"
                  >
                    <Send className="ml-1 size-4" aria-hidden />
                    ثبت ایمیل
                  </Button>
                </div>
                <p className="mt-3 text-[11px] text-cream/45">
                  فقط خبرهای خوب؛ هر وقت خواستید لغو کنید.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
      </motion.div>
    </section>
  );
}
