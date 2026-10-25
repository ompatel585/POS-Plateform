const Razorpay = require("razorpay");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { computeCartTotals } = require("../utils/orderHelpers");

// Online payment is optional: without both keys the store runs on Cash on Delivery only
const isOnlinePaymentEnabled = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let instance = null;
const getRazorpay = () => {
  if (!isOnlinePaymentEnabled()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

const isValidSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!isOnlinePaymentEnabled()) return false;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return expected === razorpaySignature;
};

const ONLINE_DISABLED_MESSAGE =
  "Online payment is not available. Please choose Cash on Delivery.";

// Lets the storefront know which payment options to show
const paymentConfig = (req, res) => {
  res.json({ online: isOnlinePaymentEnabled() });
};

// The amount is computed from the user's cart, so the client cannot change it
const checkout = asyncHandler(async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503);
    throw new Error(ONLINE_DISABLED_MESSAGE);
  }
  const totals = await computeCartTotals(req.user._id, req.body.coupon);
  if (!totals.items.length) {
    res.status(400);
    throw new Error("Your cart is empty");
  }
  const order = await razorpay.orders.create({
    amount: totals.total * 100,
    currency: "INR",
  });
  res.json({
    success: true,
    order,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

const paymentVerification = asyncHandler(async (req, res) => {
  if (!isOnlinePaymentEnabled()) {
    res.status(503);
    throw new Error(ONLINE_DISABLED_MESSAGE);
  }
  if (!isValidSignature(req.body)) {
    res.status(400);
    throw new Error("Payment verification failed");
  }
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  res.json({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
});

module.exports = {
  checkout,
  paymentVerification,
  paymentConfig,
  isValidSignature,
  isOnlinePaymentEnabled,
  ONLINE_DISABLED_MESSAGE,
};
