import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BillResult, inrPdf, chargeLines } from './calc'

export interface Meta {
  receiptNo: string; name: string; account: string; address: string; start: string; end: string
  issue: string; meterNo: string; previous: string; current: string; rate: string
  taxPct: string; status: string; method: string; notes: string
}

export function buildPdf(m: Meta, r: BillResult): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 16, CW = W - M * 2
  doc.setFillColor(10, 16, 32); doc.rect(0, 0, W, 34, 'F')
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text('VOLTÉ', M, 18)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(147, 180, 255)
  doc.text('Power. Calculated. Clearly.', M, 24)
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('ELECTRICITY BILL / PAYMENT RECEIPT', W - M, 16, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(`No. ${m.receiptNo}`, W - M, 22, { align: 'right' })

  doc.setTextColor(30); let y = 44
  const label = (t: string, x: number, yy: number) => { doc.setFontSize(7); doc.setTextColor(120); doc.setFont('helvetica', 'bold'); doc.text(t.toUpperCase(), x, yy) }
  const val = (t: string, x: number, yy: number, w: number) => {
    doc.setFontSize(10); doc.setTextColor(20); doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(t || '—', w) as string[]; doc.text(lines, x, yy); return lines.length * 4.6
  }
  label('Billed to', M, y); const h1 = val(m.name, M, y + 5, 85)
  const h2 = val([m.account && `Account: ${m.account}`, m.address].filter(Boolean).join('\n') || '', M, y + 5 + h1, 85)
  label('Billing period', 110, y); val(`${m.start || '—'} to ${m.end || '—'}`, 110, y + 5, 84)
  label('Issue date', 110, y + 15); val(m.issue, 110, y + 20, 84)
  if (m.meterNo) { label('Meter no.', 110, y + 30); val(m.meterNo, 110, y + 35, 84) }
  y += Math.max(h1 + h2 + 10, m.meterNo ? 42 : 32)

  autoTable(doc, {
    startY: y, margin: { left: M, right: M }, theme: 'grid',
    head: [['Meter reading', 'Value']],
    body: [['Previous reading', `${m.previous} kWh`], ['Current reading', `${m.current} kWh`], ['Units consumed', `${r.units} kWh`]],
    headStyles: { fillColor: [26, 34, 56] }, styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right', font: 'courier' } }
  })
  const rows: string[][] = chargeLines(r, m.rate, m.taxPct, inrPdf).map(l => [l.label, (l.negative ? '- ' : '') + inrPdf(l.amount)])
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6, margin: { left: M, right: M }, theme: 'plain',
    head: [['Charge breakdown', 'Amount']], body: rows,
    headStyles: { fillColor: [26, 34, 56], textColor: 255 }, styles: { fontSize: 9, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: { bottom: 0.1 } },
    columnStyles: { 1: { halign: 'right', font: 'courier' } }
  })
  let ty = (doc as any).lastAutoTable.finalY + 6
  if (ty > 240) { doc.addPage(); ty = 20 }
  doc.setFillColor(59, 130, 246); doc.roundedRect(M, ty, CW, 18, 2, 2, 'F')
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('TOTAL PAYABLE', M + 5, ty + 11)
  doc.setFontSize(16); doc.text(inrPdf(r.total), W - M - 5, ty + 11.5, { align: 'right' })
  ty += 26; doc.setTextColor(20); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`Payment status: ${m.status}${m.method ? ` (${m.method})` : ''}`, M, ty)
  if (m.status !== 'Unpaid') { doc.text(`Paid: ${inrPdf(r.paid)}   Balance: ${inrPdf(r.balance)}`, M, ty + 5); ty += 5 }
  if (r.overpaid > 0) { doc.text(`Overpaid by: ${inrPdf(r.overpaid)}`, M, ty + 5); ty += 5 }
  if (m.notes.trim()) {
    ty += 9; label('Notes', M, ty)
    const lines = doc.splitTextToSize(m.notes, CW) as string[]
    for (const ln of lines) { ty += 4.6; if (ty > 270) { doc.addPage(); ty = 20 } doc.setFontSize(9); doc.setTextColor(40); doc.text(ln, M, ty) }
  }
  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p); doc.setFontSize(7); doc.setTextColor(130)
    doc.text('Units = current - previous reading; energy charges = units x rate; tax applies to the positive subtotal. Independently prepared; not an official electricity-board bill.', M, 284, { maxWidth: CW - 20 })
    doc.text(`Page ${p} of ${n}`, W - M, 290, { align: 'right' })
  }
  return doc
}
