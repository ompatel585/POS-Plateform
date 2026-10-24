const Razorpay = require("razorpay");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { computeCartTotals } = require("../utils/orderHelpers");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isValidSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return expected === razorpaySignature;
};

// The amount is computed from the user's cart, so the client cannot change it
const checkout = asyncHandler(async (req, res) => {
  const totals = await computeCartTotals(req.user._id, req.body.coupon);
  if (!totals.items.length) {
    res.status(400);
    throw new Error("Your cart is empty");
  }
  const order = await instance.orders.create({
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
  isValidSignature,
};
