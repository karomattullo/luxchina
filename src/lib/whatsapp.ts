import { money } from './products'

export const WA_NUMBER = '992757543300' // +992 757 543 300 → https://wa.me/992757543300

export interface WaLine { name: string; size: string | null; color: string | null; quantity: number; unit_price: number }

export function buildWhatsAppUrl(o: { orderNumber: string; name: string; phone: string; lines: WaLine[]; total: number }): string {
  const items = o.lines.map((l) => [
    `- ${l.name}`,
    l.size ? `- Андоза: ${l.size}` : null,
    l.color ? `- Ранг: ${l.color}` : null,
    `- Миқдор: ${l.quantity}`,
    `- Нарх (1 дона): ${money(l.unit_price)}`,
    `- Маблағ: ${money(l.unit_price * l.quantity)}`,
  ].filter(Boolean).join('\n')).join('\n\n')
  const text = [
    'Фармоиши нав аз LUXCHINA', '',
    `Рақами фармоиш: #${o.orderNumber}`, '',
    `Номи муштарӣ: ${o.name}`, `Телефон: ${o.phone}`, '',
    'Маҳсулот:', '', items, '',
    `Ҳамагӣ: ${money(o.total)}`, '',
    'Салом! Ман мехоҳам ин фармоишро тасдиқ кунам. Лутфан маълумоти пардохтро фиристед.',
  ].join('\n')
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}
