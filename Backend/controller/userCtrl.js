const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const { createPasswordResetToken } = require("../models/userModel");
const {
  availableStock,
  computeCartTotals,
  deductStock,
  restoreStock,
} = require("../utils/orderHelpers");
const { isValidSignature } = require("./paymentCtrl");

// Never send these back to the client
const PRIVATE_USER_FIELDS = "-password -refreshToken -passwordResetToken -passwordResetExpires";
const PUBLIC_USER_FIELDS = "firstname lastname email mobile address";
const CANCELLABLE_STATUSES = ["Ordered", "Processed"];




const createOfflineOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod } = req.body;
  const adminId = req.user._id;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  let orderItems = [];
  let totalPrice = 0;

  for (const item of items) {
    const product = await Product.findOne({ barcode: item.barcode });

    if (!product) {
      res.status(404);
      throw new Error(`Product not found for barcode ${item.barcode}`);
    }

    if (product.quantity < item.quantity) {
      res.status(400);
      throw new Error(
        `Insufficient stock for ${product.title}`
      );
    }

    // Deduct stock
    product.quantity -= item.quantity;
    product.sold += item.quantity;
    await product.save();

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      color: product.color?.[0] || null, // safe default
    });

    totalPrice += product.price * item.quantity;
  }

  const order = await Order.create({
    user: adminId,
    orderItems,
    totalPrice,
    totalPriceAfterDiscount: totalPrice,
    paymentInfo: {
      razorpayOrderId: paymentMethod || "OFFLINE",
      razorpayPaymentId: "OFFLINE",
    },
    orderStatus: "Delivered",
    mode: "OFFLINE",
  });

  res.json({
    success: true,
    order,
  });
});


const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname, mobile } = req.body;

  const existingUser = await User.findOne({ email });

  // Case 1: New online user (fields are picked so nobody can sign up with role: "admin")
  if (!existingUser) {
    const newUser = await User.create({ firstname, lastname, email, mobile, password });
    return res.json(await User.findById(newUser._id).select(PRIVATE_USER_FIELDS));
  }

  // Case 2: Offline user activating account
  if (existingUser && !existingUser.password) {
    existingUser.password = password;
    await existingUser.save();

    return res.json({
      message: "Account activated successfully",
    });
  }

  // Case 3: Already activated
  throw new Error("User Already Exists");
});



// Create a User ----------------------------------------------

// const createUser = asyncHandler(async (req, res) => {
//   /**
//    * TODO:Get the email from req.body
//    */
//   const email = req.body.email;
//   /**
//    * TODO:With the help of email find the user exists or not
//    */
//   const findUser = await User.findOne({ email: email });

//   if (!findUser) {
//     /**
//      * TODO:if user not found user create a new user
//      */
//     const newUser = await User.create(req.body);
//     res.json(newUser);
//   } else {
//     /**
//      * TODO:if user found then thow an error: User already exists
//      */
//     throw new Error("User Already Exists");
//   }
// });
const createUser = asyncHandler(async (req, res) => {
  const { email, firstname, lastname, mobile } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const newUser = await User.create({
    firstname,
    lastname,
    email,
    mobile,
    password: null,   // IMPORTANT
    role: "user",
  });

  res.json(newUser);
});



// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  // if (findUser && (await findUser.isPasswordMatched(password))) {
  if (!findUser || !findUser.password) {
  throw new Error("Invalid Credentials");
}

if (findUser.isBlocked) {
  throw new Error("Your account has been blocked. Please contact support.");
}

if (await findUser.isPasswordMatched(password)) {

    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// admin login

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (!findAdmin || !findAdmin.password) throw new Error("Invalid Credentials");
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// logout functionality

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Update a user

const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    ).select(PRIVATE_USER_FIELDS);
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find().select(PRIVATE_USER_FIELDS).populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id).select(PRIVATE_USER_FIELDS);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();

    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='${process.env.FRONTEND_URL}/reset-password/${token}'>Click Here</>`;

    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    // The token only goes out by email; returning it would let anyone reset any account
    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ message: "Password updated successfully" });
});

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id)
      .select(PRIVATE_USER_FIELDS)
      .populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const userCart = asyncHandler(async (req, res) => {
  const { productId, color, quantity, size } = req.body;

  const { _id } = req.user;
  validateMongoDbId(_id);
  validateMongoDbId(productId);

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  if (product.sizeStock?.length && !size) {
    res.status(400);
    throw new Error("Please choose a size");
  }

  // Adding the same product/colour/size again just increases the quantity
  const existing = await Cart.findOne({
    userId: _id,
    productId,
    color: color || null,
    size: size || null,
  });
  const wanted = Number(quantity || 1) + (existing ? existing.quantity : 0);
  const inStock = availableStock(product, size);
  if (wanted > inStock) {
    res.status(400);
    throw new Error(
      inStock > 0 ? `Only ${inStock} left in stock` : "This item is out of stock"
    );
  }

  if (existing) {
    existing.quantity = wanted;
    existing.price = product.price;
    await existing.save();
    return res.json(existing);
  }

  const newCart = await new Cart({
    userId: _id,
    productId,
    color: color || null,
    size: size || null,
    price: product.price,
    quantity: wanted,
  }).save();
  res.json(newCart);
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.find({ userId: _id })
      .populate("productId")
      .populate("color");
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId } = req.params;
  validateMongoDbId(_id);
  try {
    const deleteProductFromcart = await Cart.deleteOne({
      userId: _id,
      _id: cartItemId,
    });

    res.json(deleteProductFromcart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const deleteCart = await Cart.deleteMany({
      userId: _id,
    });

    res.json(deleteCart);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId, newQuantity } = req.params;
  validateMongoDbId(_id);
  const cartItem = await Cart.findOne({
    userId: _id,
    _id: cartItemId,
  }).populate("productId");
  if (!cartItem || !cartItem.productId) {
    res.status(404);
    throw new Error("Cart item not found");
  }
  const qty = Math.max(1, Number(newQuantity) || 1);
  const inStock = availableStock(cartItem.productId, cartItem.size);
  if (qty > inStock) {
    res.status(400);
    throw new Error(`Only ${inStock} left in stock`);
  }
  cartItem.quantity = qty;
  await cartItem.save();
  res.json(cartItem);
});

// Order totals and items are rebuilt from the cart; the client only sends
// the shipping address, the coupon code and the payment proof.
const createOrder = asyncHandler(async (req, res) => {
  const { shippingInfo, paymentInfo = {}, coupon } = req.body;
  const { _id } = req.user;

  const totals = await computeCartTotals(_id, coupon);
  if (!totals.items.length) {
    res.status(400);
    throw new Error("Your cart is empty");
  }

  const isCod = paymentInfo.method === "COD";
  if (!isCod && !isValidSignature(paymentInfo)) {
    res.status(400);
    throw new Error("Payment could not be verified");
  }

  for (const item of totals.items) {
    const inStock = availableStock(item.productId, item.size);
    if (item.quantity > inStock) {
      res.status(400);
      throw new Error(`Only ${inStock} of ${item.productId.title} left in stock`);
    }
  }

  const orderItems = totals.items.map((item) => ({
    product: item.productId._id,
    color: item.color || null,
    size: item.size || null,
    quantity: item.quantity,
    price: item.productId.price,
  }));

  const order = await Order.create({
    shippingInfo,
    orderItems,
    totalPrice: totals.subtotal,
    totalPriceAfterDiscount: totals.total,
    shippingCharge: totals.shipping,
    coupon: totals.coupon || undefined,
    paymentInfo: isCod
      ? { method: "COD" }
      : {
          method: "RAZORPAY",
          razorpayOrderId: paymentInfo.razorpayOrderId,
          razorpayPaymentId: paymentInfo.razorpayPaymentId,
        },
    statusHistory: [{ status: "Ordered" }],
    user: _id,
  });

  await deductStock(orderItems);
  await Cart.deleteMany({ userId: _id });

  res.json({
    order,
    success: true,
  });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Orders that are ${order.orderStatus} can no longer be cancelled`);
  }
  order.orderStatus = "Cancelled";
  order.statusHistory.push({ status: "Cancelled" });
  await order.save();
  await restoreStock(order.orderItems);
  res.json({ order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find({ user: _id })
      .populate("user", PUBLIC_USER_FIELDS)
      .populate("orderItems.product")
      .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", PUBLIC_USER_FIELDS)
      .populate("orderItems.product")
      .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getsingleOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findOne({ _id: id })
      .populate("user", PUBLIC_USER_FIELDS)
      .populate("orderItems.product")
      .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findById(id);
    const previous = orders.orderStatus;
    if (previous === req.body.status) return res.json({ orders });
    orders.orderStatus = req.body.status;
    orders.statusHistory.push({ status: req.body.status });
    await orders.save();
    if (req.body.status === "Cancelled") {
      await restoreStock(orders.orderItems);
    }
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          month: "$month",
        },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(data);
});

const getYearlyTotalOrder = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        amount: { $sum: 1 },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(data);
});


const getProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const product = await Product.findOne({ barcode });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    _id: product._id,
    title: product.title,
    price: product.price,
    quantity: product.quantity,
    barcode: product.barcode,
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.json([]);
  }

  const users = await User.find({
    role: "user",
    $or: [
      { firstname: { $regex: query, $options: "i" } },
      { lastname: { $regex: query, $options: "i" } },
      { mobile: { $regex: query } }
    ]
  })
    .limit(10)
    .select("firstname lastname mobile address");

  res.json(users);
});



module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  createOrder,
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getAllOrders,
  getsingleOrder,
  updateOrder,
  getYearlyTotalOrder,

  removeProductFromCart,
  updateProductQuantityFromCart,
  createOfflineOrder,
  getProductByBarcode,
  registerUser,
  cancelMyOrder,
  searchUsers,

};
