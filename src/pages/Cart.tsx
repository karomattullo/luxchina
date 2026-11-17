import { Link } from 'react-router-dom'
import { useLang } from '../i18n'
import { money } from '../lib/products'
import { useShop } from '../store/shop'
import { btn, Empty } from '../components/ui'

export default function Cart() {
  const { t, pick } = useLang()
  const { cart, setQty, remove, total } = useShop()
  if (!cart.length) return <Empty text={t('cart.empty')} to="/catalog" cta={t('nav.catalog')} />
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-neutral-200">
        {cart.map((l) => (
          <li key={l.key} className="flex gap-4 py-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-gray">{l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1 text-sm">
              <Link to={`/product/${l.product_id}`} className="font-medium hover:text-brand-red">{pick(l, 'name')}</Link>
              <p className="text-neutral-500">{[l.size, l.color].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 font-bold">{money(l.unit_price)}</p>
              <div className="mt-2 flex items-center gap-3">
                <button type="button" className="h-7 w-7 rounded-full border" onClick={() => setQty(l.key, l.quantity - 1)}>−</button>
                <span>{l.quantity}</span>
                <button type="button" className="h-7 w-7 rounded-full border" onClick={() => setQty(l.key, l.quantity + 1)}>+</button>
                <button type="button" className="ml-auto text-brand-red" onClick={() => remove(l.key)}>{t('cart.remove')}</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-xl bg-brand-gray p-5">
        <p className="flex justify-between text-lg font-bold"><span>{t('cart.total')}</span><span>{money(total)}</span></p>
        <Link to="/checkout" className={`${btn} mt-4 block`}>{t('cart.checkout')}</Link>
      </aside>
    </div>
  )
}
