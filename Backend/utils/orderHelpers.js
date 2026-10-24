const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Product = require("../models/productModel");

// Keep in sync with Frontend/src/utils/pricing.js
const SHIPPING_FEE = 100;
const FREE_SHIPPING_ABOVE = 1000;

// Stock available for a product, or for one size of it when sizeStock is used
const availableStock = (product, size) => {
  if (size && product.sizeStock?.length) {
    const entry = product.sizeStock.find((s) => s.size === size);
    return entry ? entry.quantity : 0;
  }
  return product.quantity;
};

const findValidCoupon = async (name) => {
  if (!name) return null;
  const coupon = await Coupon.findOne({ name: name.trim().toUpperCase() });
  if (!coupon) throw new Error("Invalid coupon code");
  if (new Date(coupon.expiry) < new Date()) throw new Error("This coupon has expired");
  return coupon;
};

// Prices always come from the database, never from the client
const computeCartTotals = async (userId, couponName) => {
  const cart = await Cart.find({ userId }).populate("productId");
  const items = cart.filter((item) => item.productId);

  const subtotal = items.reduce(
    (sum, item) => sum + item.productId.price * item.quantity,
    0
  );
  const coupon = await findValidCoupon(couponName);
  const discount = coupon ? Math.round((subtotal * coupon.discount) / 100) : 0;
  const shipping =
    subtotal === 0 || subtotal - discount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

  return {
    items,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    coupon: coupon ? { name: coupon.name, discount: coupon.discount } : null,
  };
};

const adjustStock = async (orderItems, direction) => {
  for (const item of orderItems) {
    const productId = item.product?._id || item.product;
    const inc = { quantity: direction * item.quantity, sold: -direction * item.quantity };
    if (item.size) {
      await Product.updateOne(
        { _id: productId, "sizeStock.size": item.size },
        { $inc: { ...inc, "sizeStock.$.quantity": direction * item.quantity } }
      );
    } else {
      await Product.updateOne({ _id: productId }, { $inc: inc });
    }
  }
};

const deductStock = (orderItems) => adjustStock(orderItems, -1);
const restoreStock = (orderItems) => adjustStock(orderItems, 1);

module.exports = {
  SHIPPING_FEE,
  FREE_SHIPPING_ABOVE,
  availableStock,
  findValidCoupon,
  computeCartTotals,
  deductStock,
  restoreStock,
};
