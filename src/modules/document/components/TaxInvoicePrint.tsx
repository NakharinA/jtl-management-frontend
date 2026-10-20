import { SalesDocument } from '../types';
import { bahtText } from '../bahtText';
import { formatDate, formatMoney, PAYMENT_METHOD_LABELS } from '../format';

const branchLabel = (branch: string | null) =>
  !branch ? 'สำนักงานใหญ่' : /^\d+$/.test(branch) ? `สาขาที่ ${branch}` : branch;

/** Full tax invoice (ใบกำกับภาษีเต็มรูป), A4. */
export const TaxInvoicePrint = ({ doc }: { doc: SalesDocument }) => {
  const { seller, buyer, payment } = doc;
  const vatPercent = Math.round(doc.vatRate * 100);
  return (
    <div className="invoice">
      <style>{`
        @page { size: A4; margin: 15mm; }
        .invoice {
          max-width: 180mm; margin: 0 auto; padding: 8mm 0;
          font: 13px/1.5 'Sarabun', 'Tahoma', sans-serif; color: #000; background: #fff;
        }
        @media print { .invoice { padding: 0; } }
        .invoice h1 { font-size: 20px; text-align: center; margin: 0 0 2px; }
        .invoice .subtitle { text-align: center; margin-bottom: 12px; }
        .invoice .head { display: flex; justify-content: space-between; gap: 16px; }
        .invoice .seller-name { font-size: 16px; font-weight: 700; }
        .invoice .box { border: 1px solid #000; padding: 6px 10px; margin-top: 10px; }
        .invoice .meta td { padding: 0 0 0 8px; vertical-align: top; }
        .invoice .meta td:first-child { padding-left: 0; font-weight: 700; white-space: nowrap; }
        .invoice table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .invoice table.items th, .invoice table.items td { border: 1px solid #000; padding: 4px 6px; }
        .invoice table.items th { background: #eee; font-weight: 700; }
        .invoice .num { text-align: right; white-space: nowrap; }
        .invoice .c { text-align: center; }
        .invoice .label { font-weight: 700; }
        .invoice .words { text-align: center; font-weight: 700; }
        .invoice .note { margin-top: 6px; font-size: 12px; }
        .invoice .signs { display: flex; justify-content: space-around; margin-top: 48px; text-align: center; }
        .invoice .signs div { width: 40%; }
        .invoice .line { border-top: 1px dotted #000; margin-bottom: 4px; }
        .invoice tr { page-break-inside: avoid; }
      `}</style>

      <h1>ใบกำกับภาษี / ใบเสร็จรับเงิน</h1>
      <div className="subtitle">TAX INVOICE / RECEIPT</div>

      <div className="head">
        <div>
          <div className="seller-name">{seller.name}</div>
          {seller.address && <div>{seller.address}</div>}
          {seller.phone && <div>โทร {seller.phone}</div>}
          <div>
            เลขประจำตัวผู้เสียภาษี {seller.taxId ?? '-'} ({branchLabel(seller.branch)})
          </div>
        </div>
        <table className="meta">
          <tbody>
            <tr>
              <td>เลขที่</td>
              <td>{doc.documentNo}</td>
            </tr>
            <tr>
              <td>วันที่</td>
              <td>{formatDate(doc.issuedAt)}</td>
            </tr>
            <tr>
              <td>อ้างอิงออเดอร์</td>
              <td>#{doc.orderId.slice(0, 8)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="box">
        <table className="meta">
          <tbody>
            <tr>
              <td>ผู้ซื้อ</td>
              <td>{buyer.name}</td>
            </tr>
            <tr>
              <td>เลขประจำตัวผู้เสียภาษี</td>
              <td>
                {buyer.taxId} ({branchLabel(buyer.branch)})
              </td>
            </tr>
            <tr>
              <td>ที่อยู่</td>
              <td>{buyer.address}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="items">
        <thead>
          <tr>
            <th className="c" style={{ width: '8%' }}>ลำดับ</th>
            <th>รายการ</th>
            <th className="c" style={{ width: '10%' }}>จำนวน</th>
            <th className="num" style={{ width: '17%' }}>ราคาต่อหน่วย</th>
            <th className="num" style={{ width: '17%' }}>จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((item, i) => (
            <tr key={`${item.productId}-${i}`}>
              <td className="c">{i + 1}</td>
              <td>{item.productName}</td>
              <td className="c">{item.quantity}</td>
              <td className="num">{formatMoney(item.unitPrice)}</td>
              <td className="num">{formatMoney(item.subtotal)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} rowSpan={doc.discount > 0 ? 5 : 4} style={{ verticalAlign: 'top' }}>
              {payment && (
                <div>
                  ชำระโดย {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.referenceNumber ? ` (อ้างอิง ${payment.referenceNumber})` : ''}
                </div>
              )}
              {doc.vatInclusive && (
                <div className="note">ราคาสินค้ารวมภาษีมูลค่าเพิ่มแล้ว</div>
              )}
            </td>
            <td className="label">รวมเงิน</td>
            <td className="num">{formatMoney(doc.subtotal)}</td>
          </tr>
          {doc.discount > 0 && (
            <tr>
              <td className="label">ส่วนลด</td>
              <td className="num">-{formatMoney(doc.discount)}</td>
            </tr>
          )}
          <tr>
            <td className="label">มูลค่าก่อนภาษี</td>
            <td className="num">{formatMoney(doc.amountBeforeVat)}</td>
          </tr>
          <tr>
            <td className="label">ภาษีมูลค่าเพิ่ม {vatPercent}%</td>
            <td className="num">{formatMoney(doc.vat)}</td>
          </tr>
          <tr>
            <td className="label">รวมทั้งสิ้น</td>
            <td className="num label">{formatMoney(doc.total)}</td>
          </tr>
          <tr>
            <td colSpan={5} className="words">
              ({bahtText(doc.total)})
            </td>
          </tr>
        </tbody>
      </table>

      <div className="signs">
        <div>
          <div className="line" />
          ผู้รับเงิน / Collector
        </div>
        <div>
          <div className="line" />
          ผู้รับสินค้า / Receiver
        </div>
      </div>
    </div>
  );
};
