import { supabase } from './supabase'
import type { AdminStats, CreateOrderInput, CreateOrderResult } from '../types/database'

// Guest checkout: server validates input and reads prices/stock from the database.
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer: input.customer,
    p_items: input.items,
  })
  if (error) throw new Error(error.message) // message is a code like 'out_of_stock'
  return data as CreateOrderResult
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw new Error(error.message)
  return data as AdminStats
}

export async function trackOrder(orderNumber: string, phone: string) {
  const { data, error } = await supabase.rpc('track_order', { p_order_number: orderNumber, p_phone: phone })
  if (error) throw new Error(error.message)
  return data as import('../types/database').TrackedOrder | null
}
