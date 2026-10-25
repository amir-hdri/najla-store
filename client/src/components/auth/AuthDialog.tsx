import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  visible,
  onToggle,
}: {
  id: string;
  value: string;
  onChange(e: React.ChangeEvent<HTMLInputElement>): void;
  autoComplete: string;
  visible: boolean;
  onToggle(): void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        dir="ltr"
        className="pe-10"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute end-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={visible ? 'پنهان کردن گذرواژه' : 'نمایش گذرواژه'}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

export function AuthDialog({
  open,
  onOpenChange,
  initialTab = 'login',
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
  initialTab?: 'login' | 'register';
}) {
  const { login, register } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // register
  const [name, setName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPassword, setRPassword] = useState('');
  const [phone, setPhone] = useState('');

  function handleOpenChange(v: boolean) {
    if (!v) {
      setError(null);
      setPassword('');
      setRPassword('');
      setShowPassword(false);
    }
    onOpenChange(v);
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setError('ایمیل معتبر نیست.'); return; }
    if (!password) { setError('گذرواژه لازم است.'); return; }
    setBusy(true); setError(null);
    try {
      await login({ email, password });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد.');
    } finally { setBusy(false); }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('نام لازم است.'); return; }
    if (!EMAIL_RE.test(rEmail)) { setError('ایمیل معتبر نیست.'); return; }
    if (rPassword.length < 8) { setError('گذرواژه باید حداقل ۸ نویسه باشد.'); return; }
    setBusy(true); setError(null);
    try {
      await register({
        name: name.trim(),
        email: rEmail,
        password: rPassword,
        phone: phone.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد.');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader className="items-center gap-1.5 text-center">
          <span className="mb-1 grid size-12 place-items-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
            ن
          </span>
          <p className="text-[11px] text-gold">فروشگاه نجلا</p>
          <DialogTitle className="font-display text-2xl">خوش آمدید</DialogTitle>
          <DialogDescription>برای ثبت سفارش و پیگیری آن وارد شوید.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab} onValueChange={() => setError(null)} className="gap-4">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-full p-1">
            <TabsTrigger value="login" className="rounded-full">ورود</TabsTrigger>
            <TabsTrigger value="register" className="rounded-full">ثبت‌نام</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={submitLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">ایمیل</Label>
                <Input
                  id="login-email"
                  type="email"
                  dir="ltr"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">گذرواژه</Label>
                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  autoComplete="current-password"
                  visible={showPassword}
                  onToggle={() => setShowPassword(v => !v)}
                />
              </div>
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              )}
              <Button type="submit" className="h-10 w-full rounded-full" disabled={busy}>
                {busy && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden />}
                ورود به حساب
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={submitRegister} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">نام و نام خانوادگی</Label>
                <Input
                  id="reg-name"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(null); }}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">ایمیل</Label>
                <Input
                  id="reg-email"
                  type="email"
                  dir="ltr"
                  placeholder="you@example.com"
                  value={rEmail}
                  onChange={e => { setREmail(e.target.value); setError(null); }}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">گذرواژه (حداقل ۸ نویسه)</Label>
                <PasswordInput
                  id="reg-password"
                  value={rPassword}
                  onChange={e => { setRPassword(e.target.value); setError(null); }}
                  autoComplete="new-password"
                  visible={showPassword}
                  onToggle={() => setShowPassword(v => !v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">تلفن (اختیاری)</Label>
                <Input
                  id="reg-phone"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="0912 000 0000"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(null); }}
                  autoComplete="tel"
                />
              </div>
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              )}
              <Button type="submit" className="h-10 w-full rounded-full" disabled={busy}>
                {busy && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden />}
                ساخت حساب
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
