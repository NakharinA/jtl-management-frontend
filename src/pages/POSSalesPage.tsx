import { useState } from 'react';
import {
  Alert,
  Badge,
  Box,
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
import { Layout } from '@/shared/components/Layout';
import { usePOSProducts } from '@/modules/pos/hooks/usePOSProducts';
import { useCart } from '@/modules/pos/hooks/useCart';
import { useCheckout } from '@/modules/pos/hooks/useCheckout';
import { POSSearchBar } from '@/modules/pos/components/POSSearchBar';
import { CategoryFilter } from '@/modules/pos/components/CategoryFilter';
import { ProductGrid } from '@/modules/pos/components/ProductGrid';
import { CartPanel } from '@/modules/pos/components/CartPanel';
import { OrderSummary } from '@/modules/pos/components/OrderSummary';
import { CheckoutButtons } from '@/modules/pos/components/CheckoutButtons';
import { CheckoutDialog } from '@/modules/pos/components/CheckoutDialog';
import { PaymentMethod } from '@/modules/pos/types';

const POSSalesPage = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileTab, setMobileTab] = useState(0); // 0 = products, 1 = cart

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
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    dismissError,
  } = useCart();

  const {
    step,
    paymentMethod,
    paymentResult,
    errorMessage,
    openCheckout,
    cancelCheckout,
    confirmCheckout,
    retryCheckout,
    closeCheckout,
  } = useCheckout(cartId, clearCart);

  const handleCheckout = (method: PaymentMethod) => {
    openCheckout(method);
  };

  const handleCloseDialog = () => {
    if (step === 'SUCCESS') {
      closeCheckout();
    } else {
      cancelCheckout();
    }
  };

  // ─── Left Panel (Products) ─────────────────────────────────────────────────
  const productPanel = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <POSSearchBar value={searchQuery} onChange={setSearchQuery} />
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
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
      <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700}>
          ตะกร้าสินค้า
          {itemCount > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({itemCount} ชิ้น)
            </Typography>
          )}
        </Typography>
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

  // ─── Desktop Layout ────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <Layout>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            height: 'calc(100vh - 64px - 48px)', // AppBar + Layout padding
            overflow: 'hidden',
          }}
        >
          {/* Left: products 65% */}
          <Box sx={{ flex: '0 0 65%', maxWidth: '65%', display: 'flex', flexDirection: 'column' }}>
            {productPanel}
          </Box>
          {/* Right: cart 35% */}
          <Box sx={{ flex: '0 0 35%', maxWidth: '35%', display: 'flex', flexDirection: 'column' }}>
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

        {/* Checkout dialog */}
        <CheckoutDialog
          open={step !== 'IDLE'}
          step={step}
          paymentMethod={paymentMethod}
          paymentResult={paymentResult}
          errorMessage={errorMessage}
          subtotal={subtotal}
          onConfirm={confirmCheckout}
          onRetry={retryCheckout}
          onClose={handleCloseDialog}
        />
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
          height: 'calc(100vh - 64px - 48px)',
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

      {/* Checkout dialog */}
      <CheckoutDialog
        open={step !== 'IDLE'}
        step={step}
        paymentMethod={paymentMethod}
        paymentResult={paymentResult}
        errorMessage={errorMessage}
        subtotal={subtotal}
        onConfirm={confirmCheckout}
        onRetry={retryCheckout}
        onClose={handleCloseDialog}
      />
    </Layout>
  );
};

export default POSSalesPage;
