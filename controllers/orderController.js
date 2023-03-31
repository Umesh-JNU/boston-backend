const Order = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const { v4: uuid } = require("uuid");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/errorHandler");
const couponModel = require("../models/couponModel");

exports.createOrder = async (req, res, next) => {
  const userId = req.userId;

  const cart = await cartModel
    .findOne({ user: userId })
    .populate("items.product");

  
  if(cart.length <= 0) 
    return next(new ErrorHandler("Order can't placed. Add product to cart.", 401));
  
  const products = cart?.items?.map((i) => {
    return {
      quantity: i?.quantity,
      product: { ...i?.product?._doc },
    };
  });

  var total = 0;
  if (cart?.items.length > 0) {
    cart?.items.forEach(({ product, quantity }) => {
      total += product?.amount * quantity;
    });
  }

  const { country, post_code, town, street, mobile_no, coupon_code } = req.body;

  const unique_id = uuid();
  const orderId = unique_id.slice(0, 6);

  console.log("orderId ", orderId);
  console.log('order create', req.body);
  
  if(coupon_code) {
    const coupon = await couponModel.findOne({user: userId, _id: coupon_code});
    console.log("coupon", coupon);
    console.log({now: Date.now(), createdAt: coupon.createdAt, diff: Date.now() - coupon.createdAt})

    if(Date.now() - coupon.createdAt <= 30*60*60*1000) {
      total -= coupon.amount;
      await coupon.remove();
    }
    else return next(new ErrorHandler("Coupon is expired.", 401));
  }

  const newOrder = new Order({
    userId: userId,
    products: products,
    amount: total,
    address: {
      country,
      post_code,
      street,
      town,
      mobile_no
    },
    orderId: '#'+orderId,
  });

  try {
    const savedOrder = await newOrder.save();

    await cartModel.updateOne({ user: req.userId }, { $set: { items: [] } });

    res.status(200).json({ message: "Order created!", savedOrder });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const orders = await Order.findOne({ userId: req.userId })
      .sort({ _id: -1 })
      .limit(1);

    res.status(200).json({ message: "Order found!", orders });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getRecent = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ _id: -1 })
      .limit(4);

    res.status(200).json({ message: "Order found!", orders });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    let query = { userId: req.userId };
    if (req.query.status !== "all") query.status = req.query.status;

    const apiFeature = new APIFeatures(Order.find(query).sort({createdAt: -1}), req.query);

    const orders = await apiFeature.query;
    // const orders = await Order.find({ userId: req.userId });

    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json(err);
  }
};

// admin control
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

exports.getOrderById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("get order", id);
  const order = await Order.findById(id).sort({createdAt: -1}).populate("userId");

  if (!order) return next(new ErrorHandler("Order not found.", 404));

  res.status(200).json({ order });
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
    Order.find(query).sort({createdAt: -1}).populate("userId"),
    req.query
  );

  let orders = await apiFeature.query;
  // console.log("orders", orders);
  let filteredOrderCount = orders.length;

  apiFeature.pagination();
  orders = await apiFeature.query.clone();

  res.status(200).json({ orders, filteredOrderCount });
});
