import { SalesDocument } from '../types';
import { formatMoney, formatDateTime, PAYMENT_METHOD_LABELS } from '../format';

/** Simple receipt for an 80mm thermal printer. */
export const ReceiptPrint = ({ doc }: { doc: SalesDocument }) => {
  const { seller, payment } = doc;
  return (
    <div className="receipt">
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        .receipt {
          width: 72mm; margin: 0 auto; padding: 4mm 2mm;
          font: 12px/1.4 'Sarabun', 'Tahoma', sans-serif; color: #000; background: #fff;
        }
        .receipt .center { text-align: center; }
        .receipt .shop { font-size: 15px; font-weight: 700; }
        .receipt .title { font-size: 13px; font-weight: 700; margin-top: 4px; }
        .receipt hr { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
        .receipt .row { display: flex; justify-content: space-between; gap: 4px; }
        .receipt .item-name { word-break: break-word; }
        .receipt .muted { padding-left: 8px; }
        .receipt .total { font-size: 14px; font-weight: 700; }
      `}</style>

      <div className="center">
        <div className="shop">{seller.name || 'ร้านค้า'}</div>
        {seller.address && <div>{seller.address}</div>}
        {seller.phone && <div>โทร {seller.phone}</div>}
        {seller.taxId && <div>เลขประจำตัวผู้เสียภาษี {seller.taxId}</div>}
        <div className="title">ใบเสร็จรับเงิน</div>
      </div>
      <hr />
      <div className="row">
        <span>เลขที่</span>
        <span>{doc.documentNo}</span>
      </div>
      <div className="row">
        <span>วันที่</span>
        <span>{formatDateTime(payment?.processedAt ?? doc.issuedAt)}</span>
      </div>
      {doc.buyer.name && (
        <div className="row">
          <span>ลูกค้า</span>
          <span>{doc.buyer.name}</span>
        </div>
      )}
      <hr />
      {doc.items.map((item, i) => (
        <div key={`${item.productId}-${i}`}>
          <div className="item-name">{item.productName}</div>
          <div className="row muted">
            <span>
              {item.quantity} x {formatMoney(item.unitPrice)}
            </span>
            <span>{formatMoney(item.subtotal)}</span>
          </div>
        </div>
      ))}
      <hr />
      <div className="row">
        <span>รวมเป็นเงิน</span>
        <span>{formatMoney(doc.subtotal)}</span>
      </div>
      {doc.discount > 0 && (
        <div className="row">
          <span>ส่วนลด</span>
          <span>-{formatMoney(doc.discount)}</span>
        </div>
      )}
      <div className="row total">
        <span>ยอดสุทธิ</span>
        <span>{formatMoney(doc.total)}</span>
      </div>
      <hr />
      {payment && (
        <>
          <div className="row">
            <span>ชำระโดย</span>
            <span>{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</span>
          </div>
          {payment.method === 'cash' && payment.amountTendered !== null && (
            <>
              <div className="row">
                <span>รับเงิน</span>
                <span>{formatMoney(payment.amountTendered)}</span>
              </div>
              <div className="row">
                <span>เงินทอน</span>
                <span>{formatMoney(payment.change ?? 0)}</span>
              </div>
            </>
          )}
          {payment.referenceNumber && (
            <div className="row">
              <span>อ้างอิง</span>
              <span>{payment.referenceNumber}</span>
            </div>
          )}
          <hr />
        </>
      )}
      <div className="center">ขอบคุณที่ใช้บริการ</div>
    </div>
  );
};
