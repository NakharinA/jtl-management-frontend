import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useOrderDocuments } from '../hooks/useOrderDocuments';
import { openPrintWindow } from '../services/document.service';
import { DeliveryNoteRequestDialog } from './DeliveryNoteRequestDialog';

interface Props {
  /** Paid order; its default document is issued automatically. */
  orderId: string | null;
}

/** Print buttons for an order's receipt / delivery note (+ request a delivery note). */
export const DocumentActions = ({ orderId }: Props) => {
  const { documents, isLoading, error, requestDeliveryNote } = useOrderDocuments(orderId);
  const [requestOpen, setRequestOpen] = useState(false);

  const receipt = documents.find((d) => d.type === 'receipt');
  const deliveryNote = documents.find((d) => d.type === 'delivery_note');

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
      {deliveryNote && (
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => openPrintWindow(deliveryNote.id)}
        >
          พิมพ์ใบส่งของ ({deliveryNote.documentNo})
        </Button>
      )}
      {!deliveryNote && documents.length > 0 && (
        <Button
          variant="text"
          size="small"
          startIcon={<ReceiptLongIcon />}
          onClick={() => setRequestOpen(true)}
        >
          ขอใบส่งของ
        </Button>
      )}
      <DeliveryNoteRequestDialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSubmit={requestDeliveryNote}
      />
    </Box>
  );
};
