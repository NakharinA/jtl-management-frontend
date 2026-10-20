/**
 * Converts an amount to Thai words for documents, like Excel's BAHTTEXT.
 *
 * Examples (verified once with a throwaway node script):
 *   bahtText(0)          === 'ศูนย์บาทถ้วน'
 *   bahtText(1)          === 'หนึ่งบาทถ้วน'
 *   bahtText(11)         === 'สิบเอ็ดบาทถ้วน'
 *   bahtText(21)         === 'ยี่สิบเอ็ดบาทถ้วน'
 *   bahtText(101)        === 'หนึ่งร้อยเอ็ดบาทถ้วน'
 *   bahtText(1250.5)     === 'หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์'
 *   bahtText(0.25)       === 'ยี่สิบห้าสตางค์'
 *   bahtText(1000001)    === 'หนึ่งล้านเอ็ดบาทถ้วน'
 *   bahtText(21000000)   === 'ยี่สิบเอ็ดล้านบาทถ้วน'
 *   bahtText(3210987.01) === 'สามล้านสองแสนหนึ่งหมื่นเก้าร้อยแปดสิบเจ็ดบาทหนึ่งสตางค์'
 */
const DIGITS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

/** Reads 0..999,999. `hasHigher` = digits exist above this group (for "เอ็ด"). */
function readGroup(n: number, hasHigher: boolean): string {
  const digits = String(n).padStart(6, '0');
  let out = '';
  for (let i = 0; i < 6; i++) {
    const d = Number(digits[i]);
    const pos = 5 - i;
    if (d === 0) continue;
    if (pos === 1) {
      out += d === 1 ? 'สิบ' : d === 2 ? 'ยี่สิบ' : `${DIGITS[d]}สิบ`;
    } else if (pos === 0) {
      out += d === 1 && (hasHigher || n >= 10) ? 'เอ็ด' : DIGITS[d];
    } else {
      out += DIGITS[d] + POSITIONS[pos];
    }
  }
  return out;
}

function readNumber(n: number): string {
  if (n === 0) return '';
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const head = millions > 0 ? `${readNumber(millions)}ล้าน` : '';
  return head + readGroup(rest, millions > 0);
}

export function bahtText(amount: number): string {
  const totalSatang = Math.round(Math.abs(amount) * 100);
  const baht = Math.floor(totalSatang / 100);
  const satang = totalSatang % 100;
  const prefix = amount < 0 ? 'ลบ' : '';
  if (baht === 0 && satang === 0) return 'ศูนย์บาทถ้วน';
  const bahtPart = baht > 0 ? `${readNumber(baht)}บาท` : '';
  const satangPart = satang > 0 ? `${readNumber(satang)}สตางค์` : 'ถ้วน';
  return prefix + bahtPart + satangPart;
}
