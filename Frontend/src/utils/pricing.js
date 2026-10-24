// Keep in sync with Backend/utils/orderHelpers.js
export const SHIPPING_FEE = 100;
export const FREE_SHIPPING_ABOVE = 1000;

export const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

// The live product price is what the server charges, so prefer it over the price saved in the cart
export const unitPrice = (item) => Number(item?.productId?.price ?? item?.price ?? 0);

export const cartSubtotal = (cart) =>
  (cart || []).reduce((sum, item) => sum + Number(item.quantity) * unitPrice(item), 0);

export const shippingFor = (amountAfterDiscount) =>
  amountAfterDiscount === 0 || amountAfterDiscount >= FREE_SHIPPING_ABOVE
    ? 0
    : SHIPPING_FEE;

// Stock for a product, or for one size of it when the product uses sizeStock
export const stockFor = (product, size) => {
  if (!product) return 0;
  if (product.sizeStock?.length) {
    if (!size) return product.sizeStock.reduce((t, s) => t + (s.quantity || 0), 0);
    return product.sizeStock.find((s) => s.size === size)?.quantity || 0;
  }
  return product.quantity || 0;
};

export const LOW_STOCK_LIMIT = 5;
