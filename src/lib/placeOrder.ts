import type { CartLine } from '../store/shop'
import type { CreateOrderInput, CreateOrderResult } from '../types/database'
import { createOrder } from './api'
import { buildWhatsAppUrl, type WaLine } from './whatsapp'

export interface CheckoutForm { name: string; phone: string; city: string; address: string; comment: string }

/**
 * 1) Saves the order in Supabase. If that fails, this THROWS and no WhatsApp link exists.
 * 2) Only after a successful save it returns the order number and the wa.me link.
 * The message uses the lines/prices that the DATABASE saved (falls back to the cart if the
 * database function does not return them yet).
 */
export async function placeOrder(
  form: CheckoutForm,
  cart: CartLine[],
  create: (i: CreateOrderInput) => Promise<CreateOrderResult> = createOrder,
): Promise<{ orderNumber: string; total: number; waUrl: string }> {
  const r = await create({
    customer: form,
    items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity, size: l.size, color: l.color })),
  })
  const lines: WaLine[] = r.items && r.items.length > 0
    ? r.items.map((i) => ({ name: i.name_tj, size: i.size, color: i.color, quantity: i.quantity, unit_price: i.unit_price }))
    : cart.map((l) => ({ name: l.name_tj, size: l.size, color: l.color, quantity: l.quantity, unit_price: l.unit_price }))
  const waUrl = buildWhatsAppUrl({ orderNumber: r.order_number, name: form.name.trim(), phone: form.phone.trim(), lines, total: r.total })
  return { orderNumber: r.order_number, total: r.total, waUrl }
}
