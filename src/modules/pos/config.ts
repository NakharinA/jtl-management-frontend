/**
 * Stock tracking switch for the POS.
 *
 * Products were migrated with stock = 0 and stock management is not live yet,
 * so the POS must not block, limit, or display stock. Set to `true` once stock
 * management is in place to restore the "out of stock" / "low stock" behaviour.
 * (The product admin page is not affected by this flag.)
 */
export const STOCK_TRACKING_ENABLED = false;
