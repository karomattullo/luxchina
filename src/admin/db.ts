import { supabase } from '../lib/supabase'
import type { Order, OrderItem, Product } from '../types/database'

export const BUCKET = 'product-images'
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

export async function adminProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  fail(error); return data as Product[]
}
export async function adminOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  fail(error); return data as Order[]
}
export async function adminOrder(id: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  fail(error); if (!order) return null
  const { data: items, error: e2 } = await supabase.from('order_items').select('*').eq('order_id', id)
  fail(e2)
  return { order: order as Order, items: (items ?? []) as OrderItem[] }
}
export async function uploadImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Max 5 MB')
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  fail(error)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
export async function removeImages(urls: string[]) {
  const paths = urls.map((u) => u.split(`/${BUCKET}/`)[1]).filter(Boolean)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}
