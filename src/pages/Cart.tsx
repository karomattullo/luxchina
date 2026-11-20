import { Link } from 'react-router-dom'
import { btn, Empty } from '../components/ui'
import { useLang } from '../i18n'
import { money } from '../lib/products'
import { useShop } from '../store/shop'

export default function Cart() {
  const { t, pick } = useLang()
  const { cart, setQty, remove, total } = useShop()
  if (!cart.length) return <Empty text={t('cart.empty')} to="/catalog" cta={t('nav.catalog')} />
  return (
    <div className="pb-24 md:pb-0">
      <h1 className="mb-5 text-2xl font-extrabold md:text-3xl">{t('nav.cart')}</h1>
      <div className="grid gap-6 md:grid-cols-[1fr_340px] md:gap-8">
        <ul className="space-y-3">
          {cart.map((l) => (
            <li key={l.key} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card md:gap-4 md:p-4">
              <Link to={`/product/${l.product_id}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-gray md:h-28 md:w-24">{l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}</Link>
              <div className="flex min-w-0 flex-1 flex-col text-sm">
                <Link to={`/product/${l.product_id}`} className="line-clamp-2 font-semibold hover:text-brand-red">{pick(l, 'name')}</Link>
                <p className="mt-0.5 text-xs text-neutral-500">{[l.size, l.color].filter(Boolean).join(' · ')}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-neutral-300">
                    <button type="button" className="h-8 w-8" aria-label="−" onClick={() => setQty(l.key, l.quantity - 1)}>−</button>
                    <span className="w-6 text-center font-semibold">{l.quantity}</span>
                    <button type="button" className="h-8 w-8" aria-label="+" onClick={() => setQty(l.key, l.quantity + 1)}>+</button>
                  </div>
                  <span className="font-extrabold">{money(l.unit_price * l.quantity)}</span>
                </div>
              </div>
              <button type="button" className="self-start p-1 text-lg leading-none text-neutral-400 hover:text-brand-red" aria-label={t('cart.remove')} onClick={() => remove(l.key)}>×</button>
            </li>
          ))}
        </ul>
        <aside className="hidden h-fit rounded-2xl bg-brand-gray p-5 md:block">
          <p className="flex justify-between text-lg font-extrabold"><span>{t('cart.total')}</span><span>{money(total)}</span></p>
          <Link to="/checkout" className={`${btn} mt-4 w-full`}>{t('cart.checkout')}</Link>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="flex-1 leading-tight"><p className="text-xs text-neutral-500">{t('cart.total')}</p><p className="text-lg font-extrabold">{money(total)}</p></div>
        <Link to="/checkout" className={`${btn} flex-1`}>{t('cart.checkout')}</Link>
      </div>
    </div>
  )
}
