import { useMemo, useState, useEffect, useCallback } from 'react'
import { Zap, Download, Printer, FilePlus2, RotateCcw, ShieldCheck, Heart, Calculator, FileText, Info, X } from 'lucide-react'
import { BillInput, calculate, validate, chargeLines, inr } from './lib/calc'
import { buildPdf } from './lib/pdf'

const today = () => new Date().toISOString().slice(0, 10)
const nextNo = () => {
  const y = new Date().getFullYear()
  try {
    const n = Number(localStorage.getItem('volte:counter') || '0') + 1
    localStorage.setItem('volte:counter', String(n))
    return `VOLTE-${y}-${String(n).padStart(3, '0')}`
  } catch { return `VOLTE-${y}-${Date.now().toString().slice(-6)}` }
}
const blank = () => ({
  name: '', account: '', address: '', start: '', end: '', issue: today(), meterNo: '',
  previous: '', current: '', rate: '', fixed: '', extra: '', discount: '', taxPct: '',
  status: 'Unpaid', paid: '', method: '', notes: ''
})
type Form = ReturnType<typeof blank>

const Logo = () => (
  <span className="flex items-center gap-2 font-extrabold tracking-[0.2em] text-white">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-volt to-indigo-500 shadow-lg shadow-volt/30">
      <Zap size={18} fill="white" strokeWidth={1.5} />
    </span>VOLTÉ
  </span>
)

const Credit = () => (
  <p className="mt-3 text-[11px] tracking-wide text-slate-500">
    Crafted with <Heart size={11} className="mx-0.5 inline -translate-y-px text-volt" fill="currentColor" aria-label="love" /> by{' '}
    <span className="font-bold tracking-[0.15em] text-slate-300">YASH PANDEY</span>
  </p>
)

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block" title={hint}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs text-red-400">{error}</span>
        : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export default function App() {
  const [f, setF] = useState<Form>(blank)
  const [receiptNo, setReceiptNo] = useState(nextNo)
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)

  const input: BillInput = f
  const errors = useMemo(() => validate(input), [f])
  const r = useMemo(() => calculate(input), [f])
  const valid = Object.keys(errors).length === 0
  const hasData = f.name || f.previous || f.current || f.rate
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }))
  const show = (k: string) => (touched || (f as any)[k] !== '') && errors[k]
  const cls = (k: string) => `field ${show(k) ? 'field-err' : ''}`

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) }, [toast])
  const overpay = r.overpaid > 0

  const guard = useCallback(() => {
    setTouched(true)
    if (!valid) { setToast({ msg: 'Fix the highlighted fields first.', kind: 'err' }); return false }
    return true
  }, [valid])

  const download = async () => {
    if (!guard()) return
    setBusy(true)
    try {
      await new Promise(r => setTimeout(r, 50))
      buildPdf({ receiptNo, ...f, rate: f.rate || '0' }, r).save(`${receiptNo}.pdf`)
      setToast({ msg: `Saved ${receiptNo}.pdf`, kind: 'ok' })
    } catch (e) { setToast({ msg: 'PDF export failed: ' + (e as Error).message, kind: 'err' }) }
    finally { setBusy(false) }
  }
  const print = () => { if (guard()) window.print() }
  const reset = () => { setF(blank()); setReceiptNo(nextNo()); setTouched(false); setConfirm(false); setToast({ msg: 'New bill started.', kind: 'ok' }) }

  const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
    <tr className="border-b border-slate-200"><td className={`py-2 ${strong ? 'font-bold' : ''}`}>{k}</td>
      <td className={`py-2 text-right font-mono ${strong ? 'font-bold' : ''}`}>{v}</td></tr>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_40%_at_50%_0%,#13224a_0%,#0A1020_70%)]">
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="hidden gap-6 text-sm text-slate-300 md:flex">
            <a href="#generator" className="hover:text-white">Bill Generator</a>
            <a href="#how" className="hover:text-white">How It Works</a>
            <a href="#about" className="hover:text-white">About</a>
          </div>
          <a href="#generator" className="btn bg-volt py-2 text-white hover:bg-blue-500">Create Receipt</a>
        </div>
      </nav>

      <header className="mx-auto max-w-5xl px-4 pb-10 pt-14 text-center print:hidden">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-volt">Power. Calculated. Clearly.</p>
        <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">Your electricity bill.<br />Perfectly calculated.</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">Enter your meter readings, set your rate, and generate a clean, professional electricity bill receipt in seconds.</p>
        <a href="#generator" className="btn mt-6 bg-volt text-white shadow-lg shadow-volt/30 hover:bg-blue-500"><Zap size={16} /> Generate a Bill</a>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-slate-300">
          {[[Calculator, 'Instant calculations'], [FileText, 'PDF-ready receipts'], [Printer, 'Print-friendly design']].map(([I, t]: any) => (
            <span key={t} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><I size={14} className="text-volt" />{t}</span>
          ))}
        </div>
      </header>

      <main id="generator" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 lg:grid-cols-2">
        <section className="space-y-5 print:hidden">
          {[
            ['1 · Consumer information', <>
              <Field label="Consumer name *" error={show('name') as string}><input className={cls('name')} value={f.name} onChange={set('name')} placeholder="Full name" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account no."><input className="field" value={f.account} onChange={set('account')} /></Field>
                <Field label="Bill number"><input className="field font-mono" value={receiptNo} readOnly /></Field>
              </div>
              <Field label="Address"><textarea className="field" rows={2} value={f.address} onChange={set('address')} /></Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Period start"><input type="date" className="field" value={f.start} onChange={set('start')} /></Field>
                <Field label="Period end"><input type="date" className="field" value={f.end} onChange={set('end')} /></Field>
                <Field label="Issue date"><input type="date" className="field" value={f.issue} onChange={set('issue')} /></Field>
              </div></>],
            ['2 · Meter information', <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Previous reading (kWh) *" error={show('previous') as string}><input inputMode="decimal" className={cls('previous') + ' font-mono'} value={f.previous} onChange={set('previous')} /></Field>
                <Field label="Current reading (kWh) *" error={show('current') as string}><input inputMode="decimal" className={cls('current') + ' font-mono'} value={f.current} onChange={set('current')} /></Field>
              </div>
              <Field label="Meter number"><input className="field" value={f.meterNo} onChange={set('meterNo')} /></Field>
              <p className="rounded-lg bg-white/5 px-3 py-2 font-mono text-sm">Units consumed = current − previous = <b className="text-volt">{errors.previous || errors.current ? '—' : r.units} kWh</b></p></>],
            ['3 · Electricity tariff', <>
              <Field label="Price per unit (₹) *" error={show('rate') as string} hint="Enter your own rate; no official tariff is assumed."><input inputMode="decimal" className={cls('rate') + ' font-mono'} value={f.rate} onChange={set('rate')} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                {([['fixed', 'Fixed charge (₹)'], ['extra', 'Additional charges (₹)'], ['discount', 'Discount (₹)'], ['taxPct', 'Tax (%)']] as const).map(([k, l]) => (
                  <Field key={k} label={l} error={show(k) as string}><input inputMode="decimal" placeholder="0" className={cls(k) + ' font-mono'} value={f[k]} onChange={set(k)} /></Field>))}
              </div></>],
            ['4 · Additional information', <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Payment status"><select className="field" value={f.status} onChange={set('status')}><option>Unpaid</option><option>Paid</option><option>Partially Paid</option></select></Field>
                <Field label="Payment method"><input className="field" value={f.method} onChange={set('method')} placeholder="e.g. UPI, Cash" /></Field>
              </div>
              {f.status !== 'Unpaid' && <Field label="Amount paid (₹)" error={show('paid') as string || (overpay ? `Amount paid exceeds the total by ${inr(r.overpaid)}; shown as overpayment.` : undefined)}>
                <input inputMode="decimal" className={cls('paid') + ' font-mono'} value={f.paid} onChange={set('paid')} /></Field>}
              <Field label="Notes"><textarea className="field" rows={2} value={f.notes} onChange={set('notes')} /></Field></>]
          ].map(([t, body]: any, i) => (
            <div key={i} className="fade-in space-y-3 rounded-2xl border border-white/10 bg-charcoal/60 p-5">
              <h2 className="text-sm font-bold text-white">{t}</h2>{body}
            </div>))}
          <button className="btn border border-white/10 text-slate-300 hover:bg-white/5" onClick={() => hasData ? setConfirm(true) : reset()}><RotateCcw size={16} /> Reset Form</button>
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 flex items-center justify-between print:hidden">
            <span className="text-xs font-semibold tracking-widest text-volt">● LIVE PREVIEW</span>
          </div>
          {!hasData ? (
            <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400 print:hidden">
              <div><Zap className="mx-auto mb-3 text-volt" />Your receipt appears here as soon as you start entering details.</div></div>
          ) : (
            <div id="receipt" className="rounded-xl bg-white p-6 text-[13px] text-slate-800 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div><div className="flex items-center gap-2 text-lg font-extrabold tracking-[0.2em] text-slate-900"><Zap size={18} fill="#3B82F6" color="#3B82F6" />VOLTÉ</div>
                  <div className="text-[10px] text-slate-500">Power. Calculated. Clearly.</div></div>
                <div className="text-right"><div className="text-xs font-bold">ELECTRICITY BILL / PAYMENT RECEIPT</div>
                  <div className="font-mono text-[11px]">{receiptNo}</div></div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 break-words"><div className="text-[10px] font-bold uppercase text-slate-400">Billed to</div>
                  <div className="font-semibold">{f.name || '—'}</div>{f.account && <div>Account: {f.account}</div>}
                  <div className="whitespace-pre-wrap">{f.address}</div></div>
                <div><div className="text-[10px] font-bold uppercase text-slate-400">Period / issued</div>
                  <div>{f.start || '—'} to {f.end || '—'}</div><div>Issued: {f.issue}</div>{f.meterNo && <div>Meter: {f.meterNo}</div>}</div>
              </div>
              <table className="mt-4 w-full"><tbody>
                <Row k="Previous reading" v={`${f.previous || 0} kWh`} /><Row k="Current reading" v={`${f.current || 0} kWh`} />
                <Row k="Units consumed" v={`${errors.current || errors.previous ? '—' : r.units} kWh`} strong />
                {chargeLines(r, f.rate, f.taxPct, inr).map(l => (
                  <Row key={l.key} k={l.label} v={(l.negative ? '− ' : '') + inr(l.amount)} strong={l.strong} />))}
              </tbody></table>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
                <span className="text-xs font-bold tracking-widest">TOTAL PAYABLE</span>
                <span className="font-mono text-xl font-bold transition-all">{inr(r.total)}</span></div>
              <div className="mt-3">Status: <b>{f.status}</b>{f.method && ` · ${f.method}`}
                {f.status !== 'Unpaid' && <div className="font-mono">Paid {inr(r.paid)} · Balance {inr(r.balance)}{overpay && ` · Overpaid ${inr(r.overpaid)}`}</div>}</div>
              {f.notes && <div className="mt-3 whitespace-pre-wrap break-words border-t pt-3 text-slate-600">{f.notes}</div>}
              <p className="mt-4 border-t pt-3 text-[10px] leading-relaxed text-slate-500">Units = current − previous reading. Energy charges = units × rate. Tax applies to the positive subtotal. This is an independently prepared document, not an official electricity-board bill.</p>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 print:hidden">
            <button className="btn bg-volt text-white hover:bg-blue-500" onClick={download} disabled={busy}><Download size={16} />{busy ? 'Preparing…' : 'Download PDF'}</button>
            <button className="btn border border-white/15 text-white hover:bg-white/5" onClick={print}><Printer size={16} /> Print Receipt</button>
            <button className="btn col-span-2 border border-white/10 text-slate-300 hover:bg-white/5" onClick={() => hasData ? setConfirm(true) : reset()}><FilePlus2 size={16} /> Create New Bill</button>
          </div>
        </aside>
      </main>

      <section id="how" className="mx-auto max-w-5xl px-4 pb-12 print:hidden">
        <h2 className="mb-4 text-xl font-bold text-white">How it works</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {['Enter consumer details, meter readings and your own rate.', 'Watch units, charges, tax and balance update live.', 'Download an A4 PDF or print only the receipt.'].map((t, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-charcoal/50 p-4 text-sm text-slate-300"><b className="mr-2 text-volt">0{i + 1}</b>{t}</div>))}
        </div>
      </section>
      <section id="about" className="border-t border-white/10 px-4 py-8 text-center text-xs text-slate-500 print:hidden">
        <p className="mx-auto flex max-w-2xl items-start justify-center gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-volt" />
          Privacy: everything is calculated in your browser; nothing is sent to any server. VOLTÉ produces independently prepared bills and receipts and is not affiliated with any electricity board.</p>
        <Credit />
      </section>
      <footer className="border-t border-white/5 px-4 py-5 text-center print:hidden">
        <div className="text-[10px] font-extrabold tracking-[0.3em] text-slate-600">VOLTÉ</div>
        <Credit />
      </footer>

      {confirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 print:hidden">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-charcoal p-5">
            <h3 className="font-bold text-white">Discard this bill?</h3>
            <p className="mt-1 text-sm text-slate-400">All entered details will be cleared.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn border border-white/10" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn bg-red-500 text-white" onClick={reset}>Discard</button></div></div></div>)}
      {toast && (
        <div role="status" className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-xl print:hidden ${toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
          {toast.kind === 'ok' ? <Info size={16} /> : <X size={16} />}{toast.msg}</div>)}
    </div>
  )
}
