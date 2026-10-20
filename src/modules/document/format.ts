export const formatMoney = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Thai date (Buddhist year) in Asia/Bangkok, e.g. 20/10/2569 */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

/** Thai date + time in Asia/Bangkok, e.g. 20/10/2569 14:05 */
export const formatDateTime = (iso: string) =>
  `${formatDate(iso)} ${new Date(iso).toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด',
  qr: 'QR Code',
  card: 'บัตรเครดิต',
};
