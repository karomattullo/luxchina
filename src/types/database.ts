// Mirrors supabase/migrations/001_schema.sql exactly.
export type ProductType = 'in_stock' | 'by_order'
export type OrderStatus =
  | 'new' | 'confirmed' | 'ordered_from_china' | 'in_transit'
  | 'arrived' | 'delivered' | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'new', 'confirmed', 'ordered_from_china', 'in_transit', 'arrived', 'delivered', 'cancelled',
]

export interface Profile { id: string; role: 'customer' | 'admin'; created_at: string }

export interface Category {
  id: string; slug: string; name_tj: string; name_ru: string; sort_order: number; created_at: string
}

export interface Product {
  id: string
  category_id: string | null
  name_tj: string; name_ru: string
  description_tj: string; description_ru: string
  price: number
  discount_price: number | null
  product_type: ProductType
  stock_quantity: number
  sizes: string[]; colors: string[]
  images: string[]
  is_new: boolean; is_featured: boolean; is_published: boolean
  created_at: string; updated_at: string
}

export interface Order {
  id: string; order_number: string
  customer_name: string; phone: string; city: string; address: string; comment: string
  status: OrderStatus; total: number; created_at: string; updated_at: string
}

export interface OrderItem {
  id: string; order_id: string; product_id: string | null; product_name: string
  size: string | null; color: string | null; quantity: number; unit_price: number
}

// create_order(p_customer jsonb, p_items jsonb) -> jsonb
export interface CreateOrderInput {
  customer: { name: string; phone: string; city: string; address: string; comment?: string }
  items: { product_id: string; quantity: number; size?: string | null; color?: string | null }[]
}
export interface CreateOrderResult { order_number: string; total: number }

// admin_stats() -> jsonb
export interface AdminStats {
  total_products: number; total_orders: number; new_orders: number
  completed_orders: number; total_sales: number
}

// track_order(p_order_number, p_phone) -> jsonb | null
export interface TrackedOrder {
  order_number: string; status: OrderStatus; total: number; created_at: string
  items: { name: string; size: string | null; color: string | null; quantity: number; unit_price: number }[]
}
