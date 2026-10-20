import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useOrderDocuments } from '../hooks/useOrderDocuments';
import { openPrintWindow } from '../services/document.service';
import { TaxInvoiceRequestDialog } from './TaxInvoiceRequestDialog';

interface Props {
  /** Paid order; its default document is issued automatically. */
  orderId: string | null;
}

/** Print buttons for an order's receipt / tax invoice (+ request a tax invoice). */
export const DocumentActions = ({ orderId }: Props) => {
  const { documents, isLoading, error, requestTaxInvoice } = useOrderDocuments(orderId);
  const [requestOpen, setRequestOpen] = useState(false);

  const receipt = documents.find((d) => d.type === 'receipt');
  const taxInvoice = documents.find((d) => d.type === 'tax_invoice');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', py: 1 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          กำลังออกเอกสาร...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
      {error && (
        <Alert severity={documents.length ? 'warning' : 'error'} sx={{ py: 0 }}>
          {error}
        </Alert>
      )}
      {receipt && (
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => openPrintWindow(receipt.id)}
        >
          พิมพ์ใบเสร็จ ({receipt.documentNo})
        </Button>
      )}
      {taxInvoice && (
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => openPrintWindow(taxInvoice.id)}
        >
          พิมพ์ใบกำกับภาษี ({taxInvoice.documentNo})
        </Button>
      )}
      {!taxInvoice && documents.length > 0 && (
        <Button
          variant="text"
          size="small"
          startIcon={<ReceiptLongIcon />}
          onClick={() => setRequestOpen(true)}
        >
          ขอใบกำกับภาษี
        </Button>
      )}
      <TaxInvoiceRequestDialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSubmit={requestTaxInvoice}
      />
    </Box>
  );
};
