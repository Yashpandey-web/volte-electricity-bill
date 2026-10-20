export interface BillInput {
  previous: string; current: string; rate: string
  fixed: string; extra: string; discount: string; taxPct: string
  paid: string; name: string
}
export interface BillResult {
  units: number; energy: number; fixed: number; extra: number; discount: number
  subtotal: number; tax: number; total: number; paid: number; balance: number; overpaid: number
}
/** All money is integer paise to avoid floating point drift. */
const num = (s: string) => (s.trim() === '' ? 0 : Number(s))
const paise = (n: number) => Math.round(n * 100)

export function validate(i: BillInput): Record<string, string> {
  const e: Record<string, string> = {}
  if (!i.name.trim()) e.name = 'Consumer name is required.'
  const chk = (k: keyof BillInput, label: string, required = false) => {
    const v = i[k]
    if (v.trim() === '') { if (required) e[k] = `${label} is required.`; return }
    const n = Number(v)
    if (!Number.isFinite(n)) e[k] = `${label} must be a valid number.`
    else if (n < 0) e[k] = `${label} cannot be negative.`
  }
  chk('previous', 'Previous reading', true); chk('current', 'Current reading', true)
  chk('rate', 'Rate per unit', true); chk('fixed', 'Fixed charge'); chk('extra', 'Additional charges')
  chk('discount', 'Discount'); chk('taxPct', 'Tax percentage'); chk('paid', 'Amount paid')
  if (!e.previous && !e.current && i.previous.trim() && i.current.trim() && Number(i.current) < Number(i.previous))
    e.current = 'Current reading cannot be lower than previous reading.'
  return e
}

export function calculate(i: BillInput): BillResult {
  const units = Math.round((num(i.current) - num(i.previous)) * 1000) / 1000
  const energy = Math.round(units * num(i.rate) * 100)
  const fixed = paise(num(i.fixed)), extra = paise(num(i.extra)), discount = paise(num(i.discount))
  const subtotal = energy + fixed + extra - discount
  const tax = Math.round((Math.max(0, subtotal) * num(i.taxPct)) / 100)
  const total = Math.max(0, subtotal + tax)
  const paid = paise(num(i.paid))
  return { units, energy, fixed, extra, discount, subtotal, tax, total, paid,
    balance: Math.max(0, total - paid), overpaid: Math.max(0, paid - total) }
}

export const inr = (p: number) =>
  '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** jsPDF core fonts lack the ₹ glyph, so the PDF uses "Rs." */
export const inrPdf = (p: number) =>
  'Rs. ' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export interface ChargeLine { key: string; label: string; amount: number; negative?: boolean; strong?: boolean }
/** Rows shown in the charge table (preview, PDF, print). Optional rows appear only when > 0. */
export function chargeLines(r: BillResult, rate: string, taxPct: string, fmt: (p: number) => string): ChargeLine[] {
  const ratePaise = Math.round((Number(rate) || 0) * 100)
  const lines: ChargeLine[] = [
    { key: 'energy', label: `Energy charges (${r.units} kWh × ${fmt(ratePaise)})`, amount: r.energy }
  ]
  if (r.fixed > 0) lines.push({ key: 'fixed', label: 'Fixed charges', amount: r.fixed })
  if (r.extra > 0) lines.push({ key: 'extra', label: 'Additional charges', amount: r.extra })
  if (r.discount > 0) lines.push({ key: 'discount', label: 'Discount', amount: r.discount, negative: true })
  lines.push({ key: 'subtotal', label: 'Subtotal', amount: r.subtotal, strong: true })
  if (r.tax > 0) lines.push({ key: 'tax', label: `Tax (${Number(taxPct) || 0}%)`, amount: r.tax })
  return lines
}
