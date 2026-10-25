import { useCallback, useEffect, useState } from 'react';
import {
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AddressesAPI, AuthAPI, OrdersAPI } from '@/lib/api';
import type { Address, AddressInput, Order } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { OrderCard } from '@/components/orders/OrderCard';
import { cn } from 'cn';

const EMPTY_FORM: AddressInput = {
  label: 'خانه',
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'ایران',
};

function SectionTitle({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <h3 id={id} className="flex items-center gap-2 font-display text-lg leading-none">
      <Icon className="size-4 text-gold" aria-hidden />
      {children}
    </h3>
  );
}

export function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
}) {
  const { user, logout, refresh } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addrForm, setAddrForm] = useState<AddressInput | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [addrBusy, setAddrBusy] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setProfileMsg(null);
    setPwMsg(null);
    setAddresses(null);
    setOrders(null);
    setOrdersError(null);

    AddressesAPI.list()
      .then(r => setAddresses(r.addresses))
      .catch(() => setAddresses([]));
    OrdersAPI.list()
      .then(r => setOrders(r.orders))
      .catch(e => {
        setOrders([]);
        setOrdersError(e instanceof Error ? e.message : 'خطایی رخ داد.');
      });
  }, [open, user]);

  const loadAddresses = useCallback(async () => {
    try {
      const r = await AddressesAPI.list();
      setAddresses(r.addresses);
    } catch {
      setAddresses([]);
    }
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true); setProfileMsg(null);
    try {
      await AuthAPI.updateProfile({ name: name.trim(), phone: phone.trim() || undefined });
      await refresh();
      setProfileMsg('پروفایل ذخیره شد.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'خطایی رخ داد.');
    } finally { setProfileBusy(false); }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true); setPwMsg(null);
    try {
      await AuthAPI.changePassword({ current_password: curPw, new_password: newPw });
      setPwMsg('گذرواژه تغییر کرد. دوباره وارد شوید.');
      setCurPw(''); setNewPw('');
      logout();
      onOpenChange(false);
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : 'خطایی رخ داد.');
    } finally { setPwBusy(false); }
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addrForm) return;
    setAddrBusy(true); setAddrError(null);
    try {
      if (editId != null) {
        await AddressesAPI.update(editId, addrForm);
      } else {
        await AddressesAPI.create(addrForm);
      }
      setAddrForm(null);
      setEditId(null);
      await loadAddresses();
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'خطایی رخ داد.');
    } finally { setAddrBusy(false); }
  }

  async function deleteAddress(id: number) {
    if (!window.confirm('این نشانی حذف شود؟')) return;
    try {
      await AddressesAPI.remove(id);
      await loadAddresses();
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'خطایی رخ داد.');
    }
  }

  async function makeDefault(id: number) {
    try {
      await AddressesAPI.setDefault(id);
      await loadAddresses();
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'خطایی رخ داد.');
    }
  }

  function startEdit(a: Address) {
    setEditId(a.id);
    setAddrForm({
      label: a.label,
      full_name: a.full_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      state: a.state ?? '',
      postal_code: a.postal_code ?? '',
      country: a.country,
    });
    setAddrError(null);
  }

  function reloadOrders() {
    setOrders(null);
    setOrdersError(null);
    OrdersAPI.list()
      .then(r => setOrders(r.orders))
      .catch(e => {
        setOrders([]);
        setOrdersError(e instanceof Error ? e.message : 'خطایی رخ داد.');
      });
  }

  type TextFieldKey = Exclude<keyof AddressInput, 'is_default'>;
  const field = (key: TextFieldKey, label: string, opts?: { required?: boolean; dir?: 'ltr' }) => (
    <div className="space-y-1.5">
      <Label htmlFor={`addr-${key}`}>{label}{opts?.required ? ' *' : ''}</Label>
      <Input
        id={`addr-${key}`}
        dir={opts?.dir}
        value={addrForm?.[key] ?? ''}
        onChange={e => { setAddrForm(f => (f ? { ...f, [key]: e.target.value } : f)); setAddrError(null); }}
      />
    </div>
  );

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg" dir="rtl">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border/70 px-5 pb-4 pe-12 pt-5 text-start">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xl font-bold text-primary">
            {user.name.trim().charAt(0) || 'ن'}
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display text-xl leading-tight">حساب کاربری</DialogTitle>
            <DialogDescription dir="ltr" className="truncate text-start text-[11px]">
              {user.email}
            </DialogDescription>
          </div>
          <Badge variant="secondary" className="hidden max-w-24 truncate text-[10px] sm:inline-flex">
            {user.name}
          </Badge>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Profile */}
          <section aria-labelledby="profile-heading" className="rounded-xl border border-border/60 bg-card/40 p-3.5">
            <SectionTitle id="profile-heading" icon={UserRound}>پروفایل</SectionTitle>
            <form onSubmit={saveProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-name">نام</Label>
                <Input id="pf-name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-phone">تلفن</Label>
                <Input id="pf-phone" dir="ltr" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <Button type="submit" className="rounded-full px-4" disabled={profileBusy}>
                  {profileBusy && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden />}
                  ذخیره پروفایل
                </Button>
                {profileMsg && (
                  <p className="text-xs text-primary" role="status">{profileMsg}</p>
                )}
              </div>
            </form>
          </section>

          {/* Password */}
          <section aria-labelledby="pw-heading" className="rounded-xl border border-border/60 bg-card/40 p-3.5">
            <SectionTitle id="pw-heading" icon={KeyRound}>تغییر گذرواژه</SectionTitle>
            <form onSubmit={changePw} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pw-cur">گذرواژه فعلی</Label>
                <Input id="pw-cur" type="password" dir="ltr" autoComplete="current-password" value={curPw} onChange={e => setCurPw(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">گذرواژه جدید</Label>
                <Input id="pw-new" type="password" dir="ltr" autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <Button type="submit" variant="outline" className="rounded-full px-4" disabled={pwBusy}>
                  {pwBusy && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden />}
                  تغییر گذرواژه
                </Button>
                {pwMsg && <p className="text-xs text-muted-foreground" role="status">{pwMsg}</p>}
              </div>
            </form>
          </section>

          {/* Addresses */}
          <section aria-labelledby="addr-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle id="addr-heading" icon={MapPin}>نشانی‌ها</SectionTitle>
              {!addrForm && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setEditId(null);
                    setAddrForm({ ...EMPTY_FORM, full_name: user.name, phone: user.phone ?? '' });
                    setAddrError(null);
                  }}
                >
                  <Plus className="ml-1 size-4" aria-hidden />
                  افزودن
                </Button>
              )}
            </div>

            {addrForm && (
              <form onSubmit={saveAddress} className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{editId == null ? 'نشانی جدید' : 'ویرایش نشانی'}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => { setAddrForm(null); setEditId(null); setAddrError(null); }}
                    aria-label="بستن فرم نشانی"
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {field('label', 'برچسب')}
                  {field('full_name', 'نام کامل', { required: true })}
                  {field('phone', 'تلفن', { required: true, dir: 'ltr' })}
                  {field('city', 'شهر', { required: true })}
                  <div className="sm:col-span-2">{field('line1', 'نشانی', { required: true })}</div>
                  <div className="sm:col-span-2">{field('line2', 'نشانی (ادامه)')}</div>
                  {field('state', 'استان')}
                  {field('postal_code', 'کد پستی', { dir: 'ltr' })}
                  {field('country', 'کشور', { required: true })}
                </div>
                {addrError && (
                  <p role="alert" className="text-xs text-destructive">{addrError}</p>
                )}
                <Button type="submit" className="rounded-full px-4" disabled={addrBusy}>
                  {addrBusy && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden />}
                  ذخیره نشانی
                </Button>
              </form>
            )}

            {addresses === null ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : addresses.length === 0 && !addrForm ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-6 text-center">
                <MapPin className="size-5 text-gold/70" aria-hidden />
                <p className="text-xs text-muted-foreground">هنوز نشانی ذخیره نکرده‌اید.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {addresses.map(a => (
                  <li
                    key={a.id}
                    className={cn(
                      'flex items-start justify-between gap-2 rounded-xl border p-3 text-sm',
                      a.is_default === 1 ? 'border-primary/25 bg-primary/[0.03]' : 'border-border/60 bg-card/40',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{a.label}</span>
                        {a.is_default === 1 && (
                          <Badge variant="secondary" className="text-[9px]">پیش‌فرض</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {a.full_name} — {a.city}، {a.line1}
                        {a.line2 ? `، ${a.line2}` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">{a.phone}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      {a.is_default !== 1 && (
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => void makeDefault(a.id)} aria-label="تنظیم به‌عنوان پیش‌فرض">
                          <Star className="size-3.5" aria-hidden />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(a)} aria-label="ویرایش نشانی">
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void deleteAddress(a.id)} aria-label="حذف نشانی">
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {addrError && !addrForm && (
              <p role="alert" className="text-xs text-destructive">{addrError}</p>
            )}
          </section>

          {/* Orders */}
          <section aria-labelledby="orders-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle id="orders-heading" icon={Package}>سفارش‌های من</SectionTitle>
              <Button size="sm" variant="ghost" className="rounded-full" disabled={orders === null} onClick={reloadOrders}>
                بروزرسانی
              </Button>
            </div>
            {ordersError && <p role="alert" className="text-xs text-destructive">{ordersError}</p>}
            {orders === null ? (
              <div className="space-y-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-6 text-center">
                <Package className="size-5 text-gold/70" aria-hidden />
                <p className="text-xs text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {orders.map(o => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onChanged={next => setOrders(list => list?.map(x => (x.id === next.id ? next : x)) ?? null)}
                    onReordered={() => undefined}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="border-t border-border/70 bg-card/50 p-4">
          <Button
            variant="outline"
            className="w-full rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => { logout(); onOpenChange(false); }}
          >
            <LogOut className="ml-1 size-4" aria-hidden />
            خروج از حساب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
