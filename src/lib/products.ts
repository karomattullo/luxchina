import { supabase } from './supabase'
import type { Category, Product } from '../types/database'

export const money = (n: number) => `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} TJS`
export const finalPrice = (p: Pick<Product, 'price' | 'discount_price'>) => p.discount_price ?? p.price
export const isAvailable = (p: Product) => p.product_type === 'by_order' || p.stock_quantity > 0

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*')
    .eq('is_published', true).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Product[]
}
export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).eq('is_published', true).maybeSingle()
  if (error) throw new Error(error.message)
  return data as Product | null
}
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw new Error(error.message)
  return data as Category[]
}
