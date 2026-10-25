export type CategorySlug = 'premium' | 'classic' | 'craft' | 'gifts';

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  old_price: number | null;
  emoji: string;
  description: string;
  weight: string;
  badge: string | null;
  badge_text: string | null;
  stock: number;
}

export interface CategoryRow {
  category: CategorySlug;
  count: number;
}

export interface CartItem {
  item_id: number;
  product_id: number;
  name: string;
  emoji: string;
  price: number;
  old_price: number | null;
  category: CategorySlug;
  weight: string;
  stock: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

export interface PromoInfo {
  code: string;
  type: 'percent' | 'freeship';
  value: number;
  discount: number;
  freeShip: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: number;
}

export interface AddressInput {
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
}

export interface OrderItemRow {
  name: string;
  emoji: string;
  price: number;
  quantity: number;
  product_id: number | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_method: 'card' | 'paypal' | 'cod';
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string;
  customer_city: string;
  customer_country: string;
  promo_code: string | null;
  created_at: string;
  items?: OrderItemRow[];
}

export interface OrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address: string;
  customer_city: string;
  customer_state?: string;
  customer_postal?: string;
  customer_country: string;
  payment_method: 'card' | 'paypal' | 'cod';
  promo_code?: string;
}
