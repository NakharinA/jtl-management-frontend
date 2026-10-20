import { useCallback, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GridViewIcon from '@mui/icons-material/GridView';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Layout } from '@/shared/components/Layout';
import { usePOSProducts } from '@/modules/pos/hooks/usePOSProducts';
import { useCart } from '@/modules/pos/hooks/useCart';
import { useCheckout } from '@/modules/pos/hooks/useCheckout';
import { useConsumer } from '@/modules/pos/hooks/useConsumer';
import { POSSearchBar } from '@/modules/pos/components/POSSearchBar';
import { CategoryFilter } from '@/modules/pos/components/CategoryFilter';
import { ProductGrid } from '@/modules/pos/components/ProductGrid';
import { CartPanel } from '@/modules/pos/components/CartPanel';
import { OrderSummary } from '@/modules/pos/components/OrderSummary';
import { CheckoutButtons } from '@/modules/pos/components/CheckoutButtons';
import { CheckoutDialog } from '@/modules/pos/components/CheckoutDialog';
import { ConsumerLookupDialog } from '@/modules/pos/components/ConsumerLookupDialog';
import { Consumer, PaymentMethod } from '@/modules/pos/types';
import { orderService } from '@/modules/pos/services/order.service';
import { isApiError } from '@/services/api.client';

// Viewport height minus the AppBar and the Layout's vertical padding (24px x 2).
// dvh where supported so iPad/phone browser bars don't push the page into scroll.
const fullHeight = (toolbar: number) => ({
  height: `calc(100vh - ${toolbar + 48}px)`,
  '@supports (height: 100dvh)': { height: `calc(100dvh - ${toolbar + 48}px)` },
});

const POSSalesPage = () => {
  const theme = useTheme();
  // Two-column layout (products + cart side by side) from iPad portrait up
  // (768px); the tab layout is for phones only. noSsr: no flash of the wrong
  // layout on first render.
  const isDesktop = useMediaQuery('(min-width:768px)', { noSsr: true });
  const [mobileTab, setMobileTab] = useState(0); // 0 = products, 1 = cart

  // Consumer state for controlled-product checkout
  const [consumerDialogOpen, setConsumerDialogOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);
  const [activeConsumer, setActiveConsumer] = useState<Consumer | null>(null);
  const consumer = useConsumer();
  const resetConsumer = consumer.reset;

  const {
    categories,
    isLoading: productsLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
  } = usePOSProducts();

  const {
    cartId,
    items,
    isCartLoading,
    cartError,
    subtotal,
    itemCount,
    cartHasControlled,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    restoreItems,
    dismissError,
  } = useCart();

  // Notice shown when checkout bounces back to consumer lookup (T4)
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const handleClearCart = useCallback(() => {
    clearCart();
    setActiveConsumer(null);
  }, [clearCart]);

  // T4: order creation rejected because consumerId is missing → drop the
  // active consumer, show the error and re-open consumer lookup. Checkout
  // resumes with the same payment method once a consumer is confirmed.
  const handleConsumerRequired = useCallback(
    (method: PaymentMethod, message: string) => {
      setActiveConsumer(null);
      setCheckoutNotice(message);
      setPendingMethod(method);
      resetConsumer();
      setConsumerDialogOpen(true);
    },
    [resetConsumer],
  );

  const {
    step,
    paymentMethod,
    paymentResult,
    errorMessage,
    pendingOrder,
    openCheckout,
    confirmCheckout,
    retryCheckout,
    closeCheckout,
  } = useCheckout(cartId, handleClearCart, activeConsumer?.id ?? null, {
    onConsumerRequired: handleConsumerRequired,
  });

  const handleCheckout = (method: PaymentMethod) => {
    if (cartHasControlled && !activeConsumer) {
      setPendingMethod(method);
      consumer.reset();
      setConsumerDialogOpen(true);
    } else {
      openCheckout(method);
    }
  };

  const handleConsumerConfirmed = (confirmed: Consumer) => {
    setActiveConsumer(confirmed);
    setConsumerDialogOpen(false);
    if (pendingMethod) {
      openCheckout(pendingMethod);
      setPendingMethod(null);
    }
  };

  const handleCloseConsumerDialog = () => {
    setConsumerDialogOpen(false);
    consumer.reset();
    setPendingMethod(null);
  };

  const handleOpenConsumerSelect = () => {
    consumer.reset();
    setConsumerDialogOpen(true);
    // pendingMethod stays null — just selecting a consumer, not triggering checkout
  };

  const handleCloseDialog = () => {
    if (step !== 'SUCCESS' && pendingOrder) {
      // The order was created (server cart deleted) but not paid. "Keep the
      // cart" = rebuild a fresh server cart from the order's items so the
      // cashier can edit it and check out again. The unpaid order is left
      // open/pending on the server; it can be cancelled from order history.
      void restoreItems(pendingOrder.items);
    }
    closeCheckout();
  };

  // T5 "ยกเลิกออเดอร์": cancel the unpaid order on the server, then drop the
  // cart and consumer locally. If the server call fails the order stays
  // open and can be cancelled later from the order history page.
  const handleCancelOrder = async () => {
    const orderId = pendingOrder?.id;
    if (orderId) {
      try {
        await orderService.cancelOrder(orderId);
      } catch (err: unknown) {
        setCheckoutNotice(
          isApiError(err, 409)
            ? 'ออเดอร์นี้ชำระเงินแล้ว ไม่สามารถยกเลิกได้ — ตรวจสอบที่ประวัติการขาย'
            : 'ยกเลิกออเดอร์บนระบบไม่สำเร็จ — ยกเลิกได้ภายหลังที่หน้าประวัติการขาย',
        );
      }
    }
    handleClearCart();
    closeCheckout();
  };

  // ─── Left Panel (Products) ─────────────────────────────────────────────────
  const productPanel = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <POSSearchBar value={searchQuery} onChange={setSearchQuery} />
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5, pt: 0.5 }}>
        <ProductGrid
          products={filteredProducts}
          isLoading={productsLoading}
          onAddToCart={(p) => {
            addItem(p);
            // Auto-switch to cart on mobile after adding
            if (!isDesktop) setMobileTab(1);
          }}
          disabled={isCartLoading}
        />
      </Box>
    </Box>
  );

  // ─── Right Panel (Cart) ────────────────────────────────────────────────────
  const cartPanel = (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Cart header */}
      <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            ตะกร้าสินค้า
            {itemCount > 0 && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({itemCount} ชิ้น)
              </Typography>
            )}
          </Typography>
        </Box>
        {cartHasControlled && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
            <PersonIcon sx={{ fontSize: 16, color: activeConsumer ? 'primary.main' : 'warning.main' }} />
            {activeConsumer ? (
              <Chip
                label={`ผู้บริโภค: ${activeConsumer.name}`}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => setActiveConsumer(null)}
                deleteIcon={<CloseIcon />}
                sx={{ fontSize: '0.75rem' }}
              />
            ) : (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<PersonAddIcon sx={{ fontSize: 14 }} />}
                onClick={handleOpenConsumerSelect}
                sx={{ fontSize: '0.72rem', py: 0.25, px: 1, lineHeight: 1.5 }}
              >
                เลือกผู้บริโภค *
              </Button>
            )}
          </Box>
        )}
        {!cartHasControlled && activeConsumer && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Chip
              label={`ผู้บริโภค: ${activeConsumer.name}`}
              size="small"
              color="primary"
              variant="outlined"
              onDelete={() => setActiveConsumer(null)}
              deleteIcon={<CloseIcon />}
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        )}
      </Box>

      {/* Items list */}
      <CartPanel
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        disabled={isCartLoading}
      />

      {/* Summary + checkout */}
      <OrderSummary subtotal={subtotal} />
      <CheckoutButtons
        onCheckout={handleCheckout}
        disabled={items.length === 0 || isCartLoading}
      />
    </Paper>
  );

  // ─── Dialogs (shared by both layouts) ──────────────────────────────────────
  const dialogs = (
    <>
      <Snackbar
        open={!!checkoutNotice}
        autoHideDuration={6000}
        onClose={() => setCheckoutNotice(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setCheckoutNotice(null)} sx={{ width: '100%' }}>
          {checkoutNotice}
        </Alert>
      </Snackbar>

      {/* Checkout dialog */}
      <CheckoutDialog
        open={step !== 'IDLE'}
        step={step}
        paymentMethod={paymentMethod}
        paymentResult={paymentResult}
        errorMessage={errorMessage}
        subtotal={pendingOrder?.total ?? subtotal}
        onConfirm={confirmCheckout}
        onRetry={retryCheckout}
        onClose={handleCloseDialog}
        onCancelOrder={handleCancelOrder}
      />

      {/* Consumer lookup dialog (for controlled products) */}
      <ConsumerLookupDialog
        open={consumerDialogOpen}
        step={consumer.step}
        phone={consumer.phone}
        consumer={consumer.consumer}
        error={consumer.error}
        onSetPhone={consumer.setPhone}
        onLookup={consumer.lookup}
        onRegister={consumer.register}
        onConfirm={handleConsumerConfirmed}
        onClose={handleCloseConsumerDialog}
      />
    </>
  );

  // ─── Desktop Layout ────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <Layout>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            ...fullHeight(64), // AppBar is 64px from 600px up
            overflow: 'hidden',
          }}
        >
          {/* Left: products, takes the remaining width */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {productPanel}
          </Box>
          {/* Right: cart, fixed width so its rows and buttons never get squeezed */}
          <Box
            sx={{
              flex: '0 0 auto',
              width: { xs: 340, lg: 380 },
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {cartPanel}
          </Box>
        </Box>

        {/* Cart error snackbar */}
        <Snackbar
          open={!!cartError}
          autoHideDuration={5000}
          onClose={dismissError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={dismissError} sx={{ width: '100%' }}>
            {cartError}
          </Alert>
        </Snackbar>

        {dialogs}
      </Layout>
    );
  }

  // ─── Mobile Layout ─────────────────────────────────────────────────────────
  return (
    <Layout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          ...fullHeight(56),
          // MUI's AppBar is 48px on phones in landscape, 56px in portrait
          [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: fullHeight(48),
          [theme.breakpoints.up('sm')]: fullHeight(64),
          overflow: 'hidden',
        }}
      >
        {/* Panel area */}
        <Box sx={{ flex: 1, overflow: 'hidden', p: 0 }}>
          {mobileTab === 0 ? (
            <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {productPanel}
            </Box>
          ) : (
            <Box sx={{ height: '100%' }}>{cartPanel}</Box>
          )}
        </Box>

        {/* Bottom tabs */}
        <Tabs
          value={mobileTab}
          onChange={(_, v) => setMobileTab(v)}
          variant="fullWidth"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Tab
            icon={<GridViewIcon />}
            label="สินค้า"
            iconPosition="start"
            sx={{ minHeight: 56 }}
          />
          <Tab
            icon={
              <Badge badgeContent={itemCount} color="error" max={99}>
                <ShoppingCartIcon />
              </Badge>
            }
            label="ตะกร้า"
            iconPosition="start"
            sx={{ minHeight: 56 }}
          />
        </Tabs>
      </Box>

      {/* Cart error snackbar */}
      <Snackbar
        open={!!cartError}
        autoHideDuration={5000}
        onClose={dismissError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={dismissError} sx={{ width: '100%' }}>
          {cartError}
        </Alert>
      </Snackbar>

      {dialogs}
    </Layout>
  );
};

export default POSSalesPage;
