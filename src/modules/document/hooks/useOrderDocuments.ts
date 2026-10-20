import { useCallback, useEffect, useState } from 'react';
import { BuyerInput, SalesDocument } from '../types';
import { documentService } from '../services/document.service';

/**
 * Loads the documents of a paid order, issuing the default one (receipt or
 * tax invoice, by the order's member) first. Issuing is idempotent on the
 * server, so this doubles as "reprint".
 */
export const useOrderDocuments = (orderId: string | null) => {
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        await documentService.issue(id);
      } catch (err: unknown) {
        // Default type failed (e.g. shop member missing tax details, or the
        // shop profile is not set up) → fall back to a simple receipt.
        const msg = err instanceof Error ? err.message : 'ออกเอกสารไม่สำเร็จ';
        setError(msg);
        await documentService.issue(id, 'receipt');
      }
      setDocuments(await documentService.listByOrder(id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ออกเอกสารไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setDocuments([]);
    setError(null);
    if (orderId) void load(orderId);
  }, [orderId, load]);

  /** Issues a full tax invoice with buyer details (walk-in / person). */
  const requestTaxInvoice = useCallback(
    async (buyer: BuyerInput): Promise<SalesDocument> => {
      if (!orderId) throw new Error('ไม่พบออเดอร์');
      const doc = await documentService.issue(orderId, 'tax_invoice', buyer);
      setDocuments((prev) => [...prev.filter((d) => d.id !== doc.id), doc]);
      setError(null);
      return doc;
    },
    [orderId],
  );

  return { documents, isLoading, error, requestTaxInvoice };
};
