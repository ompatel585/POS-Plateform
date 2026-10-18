const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // shippingInfo: {
    //   firstname: {
    //     type: String,
    //     required: true,
    //   },
    //   lastname: {
    //     type: String,
    //     required: true,
    //   },
    //   address: {
    //     type: String,
    //     required: true,
    //   },
    //   city: {
    //     type: String,
    //     required: true,
    //   },
    //   state: {
    //     type: String,
    //     required: true,
    //   },
    //   other: {
    //     type: String,
    //   },
    //   pincode: {
    //     type: Number,
    //     required: true,
    //   },
    // },
    // paymentInfo: {
    //   razorpayOrderId: {
    //     type: String,
    //     required: true,
    //   },
    //   razorpayPaymentId: {
    //     type: String,
    //     required: true,
    //   },
    // },
    
    
    shippingInfo: {
  firstname: { type: String },
  lastname: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  other: { type: String },
  pincode: { type: Number },
},

paymentInfo: {
  method: { type: String, default: "RAZORPAY" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
},



    // orderItems: [
    //   {
    //     product: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Product",
    //       required: true,
    //     },
    //     // color: {
    //     //   type: mongoose.Schema.Types.ObjectId,
    //     //   ref: "Color",
    //     //   required: true,
    //     // },
    //     color: product.color?.[0] || null,

    //     quantity: {
    //       type: Number,
    //       required: true,
    //     },
    //     price: {
    //       type: Number,
    //       required: true,
    //     },
    //   },
    // ],
    
    orderItems: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: false, // ✅ optional
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
],

    coupon: {
      name: { type: String },
      discount: { type: Number },
    },
    // no default: older orders without it are recognised as legacy
    shippingCharge: {
      type: Number,
    },

    
    // functions, so the value is taken per order rather than once at server start
    paidAt: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: Number,
      default: () => new Date().getMonth(),
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalPriceAfterDiscount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      default: "Ordered",
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],
    mode: {
  type: String,
  enum: ["ONLINE", "OFFLINE"],
  default: "ONLINE",
},

  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
