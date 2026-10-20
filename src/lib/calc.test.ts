import { describe, it, expect } from 'vitest'
import { calculate, validate, chargeLines, inr, BillInput } from './calc'
const base: BillInput = { name: 'A', previous: '1250', current: '1385', rate: '7.50', fixed: '', extra: '', discount: '', taxPct: '', paid: '' }
describe('calculate', () => {
  it('spec example', () => {
    const r = calculate(base)
    expect(r.units).toBe(135); expect(r.energy).toBe(101250); expect(r.total).toBe(101250)
  })
  it('zero consumption', () => expect(calculate({ ...base, current: '1250' }).total).toBe(0))
  it('decimal readings', () => expect(calculate({ ...base, previous: '10.5', current: '12.25' }).units).toBe(1.75))
  it('discount + tax', () => {
    const r = calculate({ ...base, fixed: '100', discount: '50', taxPct: '5' })
    expect(r.subtotal).toBe(106250); expect(r.tax).toBe(5313); expect(r.total).toBe(111563)
  })
  it('partial payment', () => expect(calculate({ ...base, paid: '500' }).balance).toBe(51250))
  it('discount larger than bill never goes below zero', () => expect(calculate({ ...base, discount: '5000' }).total).toBe(0))
})
describe('validate', () => {
  it('rejects lower current', () => expect(validate({ ...base, current: '1000' }).current).toBeTruthy())
  it('rejects negatives', () => expect(validate({ ...base, rate: '-1' }).rate).toBeTruthy())
  it('requires name', () => expect(validate({ ...base, name: '' }).name).toBeTruthy())
})

const keys = (i: BillInput) => chargeLines(calculate(i), i.rate, i.taxPct, inr).map(l => l.key)
describe('chargeLines (conditional rows)', () => {
  const ex: BillInput = { ...base, previous: '5912', current: '5944', rate: '7.75' }
  it('A: all optional zero', () => {
    expect(keys(ex)).toEqual(['energy', 'subtotal'])
    const l = chargeLines(calculate(ex), ex.rate, ex.taxPct, inr)
    expect(l[0].label).toBe('Energy charges (32 kWh × ₹7.75)'); expect(l[0].amount).toBe(24800); expect(calculate(ex).total).toBe(24800)
  })
  it('B: fixed 50 only', () => { const i = { ...ex, fixed: '50' }; expect(keys(i)).toEqual(['energy', 'fixed', 'subtotal']); expect(calculate(i).total).toBe(29800) })
  it('C: additional 25 + discount 10', () => { const i = { ...ex, extra: '25', discount: '10' }; expect(keys(i)).toEqual(['energy', 'extra', 'discount', 'subtotal']); expect(calculate(i).total).toBe(26300) })
  it('D: back to zero / blank removes row', () => { expect(keys({ ...ex, fixed: '0' })).toEqual(['energy', 'subtotal']); expect(keys({ ...ex, fixed: '' })).toEqual(['energy', 'subtotal']) })
  it('tax row only when tax amount is non-zero', () => { expect(keys({ ...ex, taxPct: '0' })).not.toContain('tax'); expect(keys({ ...ex, taxPct: '5' })).toContain('tax') })
})
