import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { documentService } from '@/modules/document/services/document.service';
import { SalesDocument } from '@/modules/document/types';
import { ReceiptPrint } from '@/modules/document/components/ReceiptPrint';
import { DeliveryNotePrint } from '@/modules/document/components/DeliveryNotePrint';

/** Printable receipt / delivery note, opened in its own window. */
const PrintDocumentPage = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<SalesDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    documentService
      .get(id)
      .then(setDoc)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'ไม่พบเอกสาร'),
      );
  }, [id]);

  // Print automatically once the document has rendered
  useEffect(() => {
    if (!doc) return;
    document.title = doc.documentNo;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [doc]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
      <Box
        className="no-print"
        sx={{ display: 'flex', gap: 1, justifyContent: 'center', p: 1.5, borderBottom: '1px solid #ddd' }}
      >
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          พิมพ์
        </Button>
        <Button color="inherit" onClick={() => window.close()}>
          ปิด
        </Button>
      </Box>
      {doc.type === 'delivery_note' ? <DeliveryNotePrint doc={doc} /> : <ReceiptPrint doc={doc} />}
    </Box>
  );
};

export default PrintDocumentPage;
