const Coupon = require("../models/couponModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const asynHandler = require("express-async-handler");
const { computeCartTotals } = require("../utils/orderHelpers");

const createCoupon = asynHandler(async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);
    res.json(newCoupon);
  } catch (error) {
    throw new Error(error);
  }
});
const getAllCoupons = asynHandler(async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    throw new Error(error);
  }
});
const updateCoupon = asynHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updatecoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatecoupon);
  } catch (error) {
    throw new Error(error);
  }
});
const deleteCoupon = asynHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletecoupon = await Coupon.findByIdAndDelete(id);
    res.json(deletecoupon);
  } catch (error) {
    throw new Error(error);
  }
});
const getCoupon = asynHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getAcoupon = await Coupon.findById(id);
    res.json(getAcoupon);
  } catch (error) {
    throw new Error(error);
  }
});
// Checks a code for the logged-in customer and returns the cart totals with it applied
const applyCoupon = asynHandler(async (req, res) => {
  try {
    const { items, ...summary } = await computeCartTotals(req.user._id, req.body.coupon);
    res.json(summary);
  } catch (error) {
    res.status(400);
    throw error;
  }
});
module.exports = {
  applyCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  getCoupon,
};
