const catchAsyncError = require("../utils/catchAsyncError");
const cartModel = require("../models/cartModel");
const ErrorHandler = require("../utils/errorHandler");
const orderModel = require("../models/orderModel");
const { productModel } = require("../models/productModel");

exports.addItem = catchAsyncError(async (req, res, next) => {
  console.log("cart add", req.body);
  const { product, quantity } = req.body;

  const isProduct = await productModel.findById(product);
  if(!isProduct) 
    return next(new ErrorHandler("Product not found", 404));
  
  const cart = await cartModel.findOne({ user: req.userId });

  const isExist =
    cart?.items.filter((item) => item.product.toString() === product).length ===
    0;

  // console.log(isExist);
  if (isExist) {
    cart?.items.push({ product, quantity });
  } else {
    const index = cart?.items
      .map((item) => item.product.toString())
      .indexOf(product);

    console.log(index, cart.items[index]);
    cart.items[index].quantity = quantity;
  }

  await (await cart.save()).populate("items.product");

  var total = 0;
  if (cart?.items.length > 0) {
    cart?.items.forEach(({ product, quantity }) => {
      total += product?.amount * quantity;
    });
  }

  res.status(200).json({
    cartItems: cart.items,
    total,
  });
});

exports.deleteItem = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("id", id);
  const cart = await cartModel.findOne({ user: req.userId });
  console.log("cart", cart);

  console.log("cart items", cart?.items);
  const isExist =
    cart.items.filter((item) => item.product.toString() === id).length === 0;

  if (isExist)
    return next(new ErrorHandler("Product is not found in the cart.", 401));

  const index = cart?.items.map((item) => item.product.toString()).indexOf(id);

  await cart?.items.splice(index, 1);

  await (await cart.save()).populate("items.product");

  var total = 0;
  if (cart.items.length > 0) {
    cart?.items.forEach(({ product, quantity }) => {
      total += product?.amount * quantity;
    });
  }

  res.status(200).json({
    cartItems: cart.items,
    total,
  });
});

exports.recentCart = catchAsyncError(async (req, res, next) => {
  try {
    const order = await orderModel
      .findOne({ _id: req.body.orderId })
      .populate("products.product");

    const ord = order?.products?.map((p) => {
      return {
        product: { ...p?.product },
        quantity: p?.quantity,
      };
    });

    const cart = await cartModel.updateOne(
      { user: req.userId },
      { $set: { items: ord } }
    );

    res.status(200).json({ message: "Updated!" });
  } catch (error) {
    console.log(error);
  }
});

exports.updateItem = catchAsyncError(async (req, res, next) => {
  const { quantity } = req.body;
  const { id } = req.params;
  console.log(id);

  const cart = await cartModel.findOne({ user: req.userId });
  console.log("cart", cart);

  const isExist =
    cart.items.filter((item) => item.product.toString() === id).length === 0;

  if (isExist)
    return next(new ErrorHandler("Product is not found in the cart.", 401));

  const index = cart.items.map((item) => item.product.toString()).indexOf(id);

  console.log(index, cart.items[index]);
  cart.items[index].quantity = quantity;
  await (await cart.save()).populate("items.product");

  var total = 0;
  if (cart.items.length > 0) {
    cart.items.forEach(({ product, quantity }) => {
      total += product.amount * quantity;
    });
  }

  res.status(200).json({
    cartItems: cart.items,
    total,
  });
});

exports.getItems = catchAsyncError(async (req, res, next) => {
  const cart = await cartModel
    .findOne({ user: req.userId })
    .populate("items.product");
  console.log("cart", cart);

  var total = 0;
  if (cart?.items.length > 0) {
    cart?.items.forEach(({ product, quantity }) => {
      total += product?.amount * quantity;
    });
  }

  res.status(200).json({
    cartItems: cart.items,
    total,
  });
});
