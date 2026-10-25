import { clearToken, getSid, getToken } from './session';
import type {
  Address,
  AddressInput,
  Cart,
  CategoryRow,
  Order,
  OrderPayload,
  Product,
  PromoInfo,
  User,
} from './types';

export async function api<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Id': getSid(),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method: opts?.method || 'GET',
      headers,
      body: opts?.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new Error('ارتباط با سرور برقرار نشد.');
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      if (!res.ok) throw new Error('ارتباط با سرور برقرار نشد.');
      throw new Error('پاسخ نامعتبر از سرور.');
    }
  }

  if (!res.ok) {
    if (res.status === 401) clearToken();
    const msg = body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : '';
    throw new Error(msg || 'خطایی رخ داد. دوباره تلاش کن.');
  }

  return body as T;
}

export const AuthAPI = {
  register(input: { name: string; email: string; password: string; phone?: string }) {
    return api<{ token: string; user: User }>('/api/auth/register', { method: 'POST', body: input });
  },
  login(input: { email: string; password: string }) {
    return api<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: input });
  },
  me() {
    return api<{ user: User }>('/api/auth/me');
  },
  updateProfile(input: { name?: string; phone?: string }) {
    return api<{ user: User }>('/api/auth/profile', { method: 'PUT', body: input });
  },
  changePassword(input: { current_password: string; new_password: string }) {
    return api<{ message: string }>('/api/auth/password', { method: 'PUT', body: input });
  },
  mergeCart() {
    return api<Cart>('/api/cart/merge', { method: 'POST', body: { session_id: getSid() } });
  },
};

export const CatalogAPI = {
  listProducts(params?: { category?: string; search?: string; sort?: string }) {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.sort) q.set('sort', params.sort);
    const qs = q.toString();
    return api<{ products: Product[] }>(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getProduct(id: number) {
    return api<{ product: Product }>(`/api/products/${id}`);
  },
  listCategories() {
    return api<{ categories: CategoryRow[] }>('/api/categories');
  },
};

export const CartAPI = {
  get() {
    return api<{ cart: Cart }>('/api/cart');
  },
  add(product_id: number, quantity = 1) {
    return api<{ cart: Cart }>('/api/cart', { method: 'POST', body: { product_id, quantity } });
  },
  update(item_id: number, quantity: number) {
    return api<{ cart: Cart }>(`/api/cart/${item_id}`, { method: 'PUT', body: { quantity } });
  },
  remove(item_id: number) {
    return api<{ cart: Cart }>(`/api/cart/${item_id}`, { method: 'DELETE' });
  },
  clear() {
    return api<{ cart: Cart }>('/api/cart', { method: 'DELETE' });
  },
};

export const PromoAPI = {
  validate(code: string, subtotal: number) {
    return api<{ promo: PromoInfo }>('/api/promo/validate', { method: 'POST', body: { code, subtotal } });
  },
};

export const AddressesAPI = {
  list() {
    return api<{ addresses: Address[] }>('/api/addresses');
  },
  create(input: AddressInput) {
    return api<{ address: Address }>('/api/addresses', { method: 'POST', body: input });
  },
  update(id: number, input: Partial<AddressInput>) {
    return api<{ address: Address }>(`/api/addresses/${id}`, { method: 'PUT', body: input });
  },
  remove(id: number) {
    return api<{ message: string }>(`/api/addresses/${id}`, { method: 'DELETE' });
  },
  setDefault(id: number) {
    return api<{ address: Address }>(`/api/addresses/${id}/default`, { method: 'PUT' });
  },
};

export const OrdersAPI = {
  create(payload: OrderPayload) {
    return api<{ order: Order }>('/api/orders', { method: 'POST', body: payload });
  },
  list() {
    return api<{ orders: Order[] }>('/api/orders');
  },
  cancel(id: number) {
    return api<{ order: Order }>(`/api/orders/${id}/cancel`, { method: 'POST' });
  },
  reorder(id: number) {
    return api<{ cart: Cart }>(`/api/orders/${id}/reorder`, { method: 'POST' });
  },
};
