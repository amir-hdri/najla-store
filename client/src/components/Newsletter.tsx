import { useState } from 'react';
import { ArrowLeft, Check, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/newsletter', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setSent(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'ثبت ایمیل انجام نشد. دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="mx-auto max-w-6xl px-4 pb-14 md:px-6"
    >
      <div className="grid items-center gap-8 rounded-3xl bg-espresso px-6 py-9 text-cream md:grid-cols-2 md:px-10 md:py-12">
        <div>
          <Mail
            className="mb-4 size-6 text-gold"
            strokeWidth={1.5}
            aria-hidden
          />
          <h2 id="newsletter-heading" className="font-display text-4xl">
            از تازه‌های نجلا باخبر شوید
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-cream/75">
            ایمیل‌تان را برای دریافت خبر محصولات و پیشنهادهای فصلی ثبت کنید.
          </p>
        </div>
        {sent ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-cream/20 p-5 text-sm leading-7"
          >
            <Check className="size-5 shrink-0 text-gold" aria-hidden />
            ایمیل شما در فهرست خبرنامه ثبت شد.
          </div>
        ) : (
          <form onSubmit={subscribe}>
            <label htmlFor="newsletter-email" className="mb-2 block text-sm">
              نشانی ایمیل
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="newsletter-email"
                type="email"
                required
                maxLength={160}
                autoComplete="email"
                dir="ltr"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                aria-invalid={!!error}
                aria-describedby={error ? 'newsletter-error' : undefined}
                className="h-12 min-w-0 rounded-xl border-cream/30 bg-white px-4 text-[#20362d] placeholder:text-[#626e65] dark:bg-white"
              />
              <Button
                disabled={busy}
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-[#dfbf85] px-5 text-[#192c20] hover:bg-[#ecd3a5]"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowLeft className="size-4" aria-hidden />
                )}
                عضویت در خبرنامه
              </Button>
            </div>
            {error && (
              <p
                id="newsletter-error"
                role="alert"
                className="mt-3 text-sm leading-6 text-red-200"
              >
                {error}
              </p>
            )}
            <p className="mt-3 text-xs leading-6 text-cream/70">
              با ثبت ایمیل، با دریافت خبرهای نجلا موافقت می‌کنید.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
