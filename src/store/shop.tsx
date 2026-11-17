import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface CartLine {
  key: string; product_id: string; name_tj: string; name_ru: string; image: string | null
  unit_price: number; size: string | null; color: string | null; quantity: number
}
interface Shop {
  cart: CartLine[]; favs: string[]; count: number; total: number
  add: (l: Omit<CartLine, 'key'>) => void
  setQty: (key: string, q: number) => void
  remove: (key: string) => void
  clear: () => void
  toggleFav: (id: string) => void
}
const Ctx = createContext<Shop | null>(null)

function load<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => load('luxchina.cart', []))
  const [favs, setFavs] = useState<string[]>(() => load('luxchina.favs', []))
  useEffect(() => save('luxchina.cart', cart), [cart])
  useEffect(() => save('luxchina.favs', favs), [favs])

  const value = useMemo<Shop>(() => ({
    cart, favs,
    count: cart.reduce((s, l) => s + l.quantity, 0),
    total: cart.reduce((s, l) => s + l.quantity * l.unit_price, 0),
    add: (l) => setCart((c) => {
      const key = `${l.product_id}|${l.size ?? ''}|${l.color ?? ''}`
      const i = c.findIndex((x) => x.key === key)
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], unit_price: l.unit_price, quantity: Math.min(99, n[i].quantity + l.quantity) }; return n }
      return [...c, { ...l, key }]
    }),
    setQty: (key, q) => setCart((c) => c.map((x) => (x.key === key ? { ...x, quantity: Math.max(1, Math.min(99, q)) } : x))),
    remove: (key) => setCart((c) => c.filter((x) => x.key !== key)),
    clear: () => setCart([]),
    toggleFav: (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
  }), [cart, favs])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useShop(): Shop {
  const c = useContext(Ctx)
  if (!c) throw new Error('useShop must be used inside <ShopProvider>')
  return c
}
