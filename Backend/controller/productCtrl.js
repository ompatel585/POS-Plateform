//Backend/controller/productCtrl.js
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");

// const createProduct = asyncHandler(async (req, res) => {
//   try {
//     if (req.body.title) {
//       req.body.slug = slugify(req.body.title);
//     }
//     const newProduct = await Product.create(req.body);
//     res.json(newProduct);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// const createProduct = asyncHandler(async (req, res) => {
//   try {
//     if (req.body.title) {
//       req.body.slug = slugify(req.body.title);
//     }

//     // 1️⃣ Create product first (without barcode)
//     const product = await Product.create(req.body);

//     // 2️⃣ Generate barcode from Mongo _id
//     const shortId = product._id.toString().slice(-6).toUpperCase();
//     const barcode = `PRD-${shortId}`;

//     // 3️⃣ Save barcode once
//     product.barcode = barcode;
//     await product.save();

//     res.json(product);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

const createProduct = asyncHandler(async (req, res) => {
  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    // 🔑 NORMALIZE INVENTORY
    req.body.inventory = {
      offline: true,
      online: req.body.inventory?.online === true,
    };


    const product = await Product.create(req.body);

    const shortId = product._id.toString().slice(-6).toUpperCase();
    product.barcode = `PRD-${shortId}`;
    
    // Generate unique barcodes for each size in sizeStock
    if (product.sizeStock && product.sizeStock.length > 0) {
      for (let i = 0; i < product.sizeStock.length; i++) {
        let sizeBarcode = `PRD-${shortId}-${product.sizeStock[i].size}`;
        
        // Ensure barcode is unique by checking database
        let counter = 1;
        let originalBarcode = sizeBarcode;
        while (await Product.findOne({ "sizeStock.barcode": sizeBarcode })) {
          sizeBarcode = `${originalBarcode}-${counter}`;
          counter++;
        }
        
        product.sizeStock[i].barcode = sizeBarcode;
      }
    }
    
    await product.save();

    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});






// const updateProduct = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   validateMongoDbId(id);
//   try {
//     if (req.body.title) {
//       req.body.slug = slugify(req.body.title);
//     }
//     // const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
//     //   new: true,
//     // });

//     const { barcode, ...safeBody } = req.body;

// if (safeBody.inventory) {
//   safeBody.inventory = {
//     offline: true,
//     online: !!safeBody.inventory.online,
//   };
// }


//     res.json(updateProduct);
//   } catch (error) {
//     throw new Error(error);
//   }
// });




const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }

  // Don't allow manual barcode updates from frontend
  const { barcode, sizeStock, ...safeBody } = req.body;

  if (safeBody.inventory) {
    safeBody.inventory = {
      offline: true,
      online: !!safeBody.inventory.online,
    };
  }

  const existingProduct = await Product.findById(id);
  
  // If sizeStock is being updated, regenerate barcodes for each size
  if (sizeStock && sizeStock.length > 0) {
    const shortId = existingProduct._id.toString().slice(-6).toUpperCase();
    const updatedSizeStock = sizeStock.map(item => ({
      ...item,
      barcode: item.barcode || `PRD-${shortId}-${item.size}`
    }));
    safeBody.sizeStock = updatedSizeStock;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    safeBody,
    { new: true }
  );

  res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    res.json(deletedProduct);
  } catch (error) {
    throw new Error(error);
  }
});


// const getAllProduct = asyncHandler(async (req, res) => {
//   try {
//     // Filtering
//     const queryObj = { ...req.query };

//       // 🔑 ADD THIS
//     if (queryObj.store === "true") {
//       queryObj["inventory.online"] = true;
//     }
//     const excludeFields = ["page", "sort", "limit", "fields"];
//     excludeFields.forEach((el) => delete queryObj[el]);
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

//     let query = Product.find(JSON.parse(queryStr));

//     // Sorting

//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(",").join(" ");
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort("-createdAt");
//     }

//     // limiting the fields

//     if (req.query.fields) {
//       const fields = req.query.fields.split(",").join(" ");
//       query = query.select(fields);
//     } else {
//       query = query.select("-__v");
//     }

//     // pagination

//     const page = req.query.page;
//     const limit = req.query.limit;
//     const skip = (page - 1) * limit;
//     query = query.skip(skip).limit(limit);
//     if (req.query.page) {
//       const productCount = await Product.countDocuments();
//       if (skip >= productCount) throw new Error("This Page does not exists");
//     }
//     const product = await query;
//     res.json(product);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id)
      .populate("color")
      .populate("ratings.postedby", "firstname lastname");
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTABLE_FIELDS = ["title", "price", "createdAt", "sold", "totalrating"];

const getAllProduct = asyncHandler(async (req, res) => {
  const { brand, category, tags, color, price, q, size, sort, limit } = req.query;
  const filter = {};

  // 🔒 the public store only ever sees products enabled for online sale
  if (req.query.store === "true") filter["inventory.online"] = true;

  // only whitelisted fields, so query strings cannot inject Mongo operators
  if (typeof brand === "string") filter.brand = brand;
  if (typeof category === "string") filter.category = category;
  if (typeof tags === "string") filter.tags = tags;
  if (typeof color === "string") filter.color = color;
  if (price && typeof price === "object") {
    filter.price = {};
    ["gte", "gt", "lte", "lt"].forEach((op) => {
      if (price[op] !== undefined && !isNaN(Number(price[op]))) {
        filter.price[`$${op}`] = Number(price[op]);
      }
    });
  }
  if (typeof size === "string") {
    filter.sizeStock = { $elemMatch: { size, quantity: { $gt: 0 } } };
  }
  if (typeof q === "string" && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ title: rx }, { brand: rx }, { category: rx }, { tags: rx }];
  }

  const sortBy =
    typeof sort === "string" &&
    SORTABLE_FIELDS.includes(sort.replace(/^-/, ""))
      ? sort
      : "-createdAt";

  let query = Product.find(filter).sort(sortBy);
  if (Number(limit) > 0) query = query.limit(Number(limit));

  res.json(await query);
});


const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById(_id);
    const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
    if (alreadyadded) {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      ).select("firstname lastname email wishlist");
      res.json(user);
    } else {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      ).select("firstname lastname email wishlist");
      res.json(user);
    }
  } catch (error) {
    throw new Error(error);
  }
});

const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, comment } = req.body;
  validateMongoDbId(prodId);
  const stars = Number(star);
  if (!(stars >= 1 && stars <= 5)) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5 stars");
  }

  // Only customers who ordered the product (and didn't cancel) can review it
  const purchased = await Order.exists({
    user: _id,
    "orderItems.product": prodId,
    orderStatus: { $ne: "Cancelled" },
  });
  if (!purchased) {
    res.status(403);
    throw new Error("Only customers who bought this product can review it");
  }

  const product = await Product.findById(prodId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const alreadyRated = product.ratings.find(
    (r) => r.postedby?.toString() === _id.toString()
  );
  if (alreadyRated) {
    await Product.updateOne(
      { _id: prodId, "ratings.postedby": _id },
      {
        $set: {
          "ratings.$.star": stars,
          "ratings.$.comment": comment,
          "ratings.$.verified": true,
          "ratings.$.postedAt": new Date(),
        },
      }
    );
  } else {
    await Product.updateOne(
      { _id: prodId },
      {
        $push: {
          ratings: { star: stars, comment, postedby: _id, verified: true },
        },
      }
    );
  }

  const updated = await Product.findById(prodId);
  const sum = updated.ratings.reduce((total, r) => total + r.star, 0);
  updated.totalrating = Math.round((sum / updated.ratings.length) * 10) / 10;
  await updated.save();

  const finalproduct = await Product.findById(prodId)
    .populate("color")
    .populate("ratings.postedby", "firstname lastname");
  res.json(finalproduct);
});

module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
};

