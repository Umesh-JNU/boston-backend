const fs = require('fs');
const path = require('path');
const Order = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const { v4: uuid } = require("uuid");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/errorHandler");
const couponModel = require("../models/couponModel");
const addressModel = require("../models/addressModel");
const { calc_shipping } = require("./addressController");
const userModel = require("../models/userModel");
const { sendEmail } = require("../utils/sendEmail")

const { productModel, subProdModel } = require("../models/productModel");

const checkOrderAndUpdate = async (order, amount, fullPayment) => {
  let product_list = "";
  for (var i in order.products) {
    // console.log({ p: order.products[i] })
    const { product, quantity, parent_prod, updatedAmount } = order.products[i];

    if (fullPayment && (order.free_ship || order.shipping_charge === 0)) {
      const prod = await subProdModel.findById(product._id);
      prod.volume = product.volume - quantity;
      prod.stock = (product.volume - quantity) > 0;
      await prod.save();
    }


    product_list += `<tr>
      <td>${parseInt(i) + 1}</td>
      <td>${parent_prod?.name}</td>
      <td>${product?.qname}</td>
      <td>${quantity}</td>
      <td>${updatedAmount}</td>
      <td>${quantity * updatedAmount}</td>
    </tr>`;
  }


  const orderDetails = {
    product_list,
    shipping: `${order.free_ship ? 0 : order.shipping_charge}`,
    ttl_amount: `${order.amount + order.points_used + order.coupon_amount}`,
    amount: `${amount}`,
    coupon_amount: `${order.coupon_amount}`,
    points: `${order.points_used}`,
    status: fullPayment && (order.free_ship || order.shipping_charge === 0) ? 'paid' : order.status,
    orderId: order.orderId,
    ...order.address,
    unit: order.address?.unit || ' ',
    dashbaord_link: `https://admin.bostongexotics.com/admin/view/order/${order._id}`,

  }

  console.log({ orderDetails, order });

  const template = fs.readFileSync(path.join(__dirname + "/points.html"), "utf-8");
  // /{{(\w+)}}/g - match {{Word}} globally
  const renderedTemplate = template.replace(/{{(\w+)}}/g, (match, key) => {
    console.log({ match, key })
    return orderDetails[key] || match;
  });


  await sendEmail(`Payment Made with Points - ${order.orderId}`, renderedTemplate, process.env.CLIENT_EMAIL);
  console.log({ renderedTemplate });
};

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  console.log({ body: req.body });

  const cart = await cartModel
    .findOne({ user: userId })
    .populate({
      path: "items.product",
      populate: { path: "pid", select: "-subProduct" }
    });

  if (cart?.items.length <= 0)
    return next(new ErrorHandler("Order can't placed. Add product to cart.", 401));
  console.log(cart.items[0].product);

  // update the product status
  for (var i in cart.items) {
    console.log(i, cart.items[i]);
    const { product, quantity } = cart.items[i];
    if (quantity > product.volume) {
      return next(new ErrorHandler("Some of items in your cart is out of stock.", 400));
    }

    const prod = await subProdModel.findById(product._id);
    if (!prod) {
      return next(new ErrorHandler("Something went wrong.", 400));
    }

    // prod.volume = product.volume - quantity;
    // prod.stock = (product.volume - quantity) > 0;
    // await prod.save();
    // await subProdModel.findByIdAndUpdate(product._id, { volume: product.volume - quantity });
  }

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

  const { addr_id, mobile_no, coupon_code, sameDayDel, use_points } = req.body;

  const addr = await addressModel.findById(addr_id);
  if (!addr) return next(new ErrorHandler("Address not found", 404));

  const { province, town, street, post_code, unit } = addr;
  let [charge, _] = await calc_shipping(total, addr, next);

  const unique_id = uuid();
  const orderId = unique_id.slice(0, 6);

  console.log("orderId ", orderId);
  console.log('order create', req.body);

  var point_Decrease = 0;
  var coupon_Decrease = 0;
  var isFullPayment = false;

  if (coupon_code) {
    const coupon = await couponModel.findOne({ user: userId, _id: coupon_code, status: "valid" });

    if (!coupon) return next(new ErrorHandler("Invalid coupon or has been expired.", 400));
    console.log("coupon", coupon);
    console.log({ now: Date.now(), createdAt: coupon.createdAt, diff: Date.now() - coupon.createdAt })

    if (Date.now() - coupon.createdAt <= 30 * 60 * 60 * 1000) {
      coupon_Decrease = coupon.amount;
      total -= coupon.amount;

      coupon.status = "used";
      await coupon.save();
    }
    else {
      coupon.status = "expired";
      await coupon.save();
      return next(new ErrorHandler("Coupon is expired.", 401));
    }
  }

  const user = await userModel.findById(userId);

  if (use_points) {
    const points = user.points;

    if (points < 10) {
      return next(new ErrorHandler("Use Minimum 10 points to avail.", 401));
    }
    else {
      if (total <= points) {
        point_Decrease = total;
        total = 0;
        isFullPayment = true;
      }
      else {
        total = total - points;
        point_Decrease = points
      }
    }
  }

  if (!user.free_ship) {
    total += charge;
  }

  const savedOrder = await Order.create({
    userId: userId,
    products: products,
    amount: total,
    coupon_amount: coupon_Decrease,
    points_used: point_Decrease,
    shipping_charge: charge,
    free_ship: user.free_ship,
    address: {
      province,
      post_code,
      street,
      town,
      unit,
      mobile_no
    },
    orderId: '#' + orderId,
    same_day_del: sameDayDel
  });

  if (point_Decrease > 0) {
    await checkOrderAndUpdate(savedOrder, total, isFullPayment);
    console.log({ isFullPayment, s: savedOrder.free_ship })
    if (isFullPayment && (savedOrder.free_ship || savedOrder.shipping_charge === 0)) {
      savedOrder.status = "paid";
      await savedOrder.save();
    }

    user.points -= point_Decrease;
    await user.save();
  }

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

  if (order.status === "paid") {
    for (var i in order.products) {
      // console.log({ p: order.products[i] })
      const { product, quantity } = order.products[i];


      const prod = await subProdModel.findById(product._id);
      prod.volume = prod.volume - quantity;
      prod.stock = (prod.volume - quantity) > 0;
      await prod.save();

    }
  }
  if (order.status === "cancelled") {
    const user = await userModel.findById(order.userId)
    user.points += order.points_used;
    user.save()
  }
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