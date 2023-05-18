const Order = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const { v4: uuid } = require("uuid");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/errorHandler");
const couponModel = require("../models/couponModel");

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  const cart = await cartModel
    .findOne({ user: userId })
    .populate({
      path: "items.product",
      populate: { path: "pid", select: "-subProduct" }
    });

  if (cart?.items.length <= 0)
    return next(new ErrorHandler("Order can't placed. Add product to cart.", 401));
  console.log(cart.items[0].product);

  var total = 0;
  const products = cart.items.map((item) => {
    const { product, quantity } = item;
    const amt = product.amount;
    const discount = product.pid.sale;
    const updatedAmount = amt * (1 - discount * 0.01);
    total += updatedAmount * quantity;
    console.log({ product, quantity, amt, discount, updatedAmount });

    return {
      quantity,
      product: product._doc,
      parent_prod: product.pid._doc,
      updatedAmount,
    };
  });

  const { province, post_code, town, street, mobile_no, coupon_code } = req.body;

  const unique_id = uuid();
  const orderId = unique_id.slice(0, 6);

  console.log("orderId ", orderId);
  console.log('order create', req.body);

  if (coupon_code) {
    const coupon = await couponModel.findOne({ user: userId, _id: coupon_code });
    console.log("coupon", coupon);
    console.log({ now: Date.now(), createdAt: coupon.createdAt, diff: Date.now() - coupon.createdAt })

    if (Date.now() - coupon.createdAt <= 30 * 60 * 60 * 1000) {
      total -= coupon.amount;
      await coupon.remove();
    }
    else return next(new ErrorHandler("Coupon is expired.", 401));
  }

  const savedOrder = await Order.create({
    userId: userId,
    products: products,
    amount: total,
    address: {
      province,
      post_code,
      street,
      town,
      mobile_no
    },
    orderId: '#' + orderId,
  });

  await cartModel.updateOne({ user: req.userId }, { $set: { items: [] } });

  res.status(200).json({ message: "Order created!", savedOrder });
});

exports.getAll = catchAsyncError(async (req, res, next) => {
  let query = { userId: req.userId };
  if (req.query.status !== "all") query.status = req.query.status;

  const apiFeature = new APIFeatures(Order.find(query).sort({ createdAt: -1 }), req.query);

  const orders = await apiFeature.query;

  res.status(200).json({ orders });
});

// for admin
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  console.log("req.query", req.query);
  let query = {};
  if (req.query.orderId) {
    query = {
      orderId: {
        $regex: req.query.orderId,
        $options: "i",
      },
    };
  }

  if (req.query.status !== "all") query.status = req.query.status;

  console.log("query", query);
  const apiFeature = new APIFeatures(
    Order.find(query).sort({ createdAt: -1 }).populate("userId"),
    req.query
  );

  let orders = await apiFeature.query;
  // console.log("orders", orders);
  let filteredOrderCount = orders.length;

  apiFeature.pagination();
  orders = await apiFeature.query.clone();

  res.status(200).json({ orders, filteredOrderCount });
});

exports.getOrderById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("get order", id);
  const order = await Order.findById(id).sort({ createdAt: -1 }).populate("userId");

  if (!order) return next(new ErrorHandler("Order not found.", 404));

  res.status(200).json({ order });
});

exports.getOrder = catchAsyncError(async (req, res, next) => {
  const orders = await Order.findOne({ userId: req.userId })
    .sort({ _id: -1 }).limit(1);

  res.status(200).json({ message: "Order found!", orders });
});

exports.getRecent = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ userId: req.userId })
    .sort({ _id: -1 }).limit(4);;

  res.status(200).json({ message: "Order found!", orders });
});


exports.updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found.", 404));

  order.status = status;
  await order.save();
  res.status(200).json({ order });
});

exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let order = await Order.findById(id);
  console.log("delete order", order);
  if (!order) {
    return res.status(404).json({ message: "Order Not Found" });
  }

  await order.remove();

  res.status(200).json({
    success: true,
    message: "Order Deleted successfully.",
  });
});