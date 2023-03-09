const Order = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const { v4: uuid } = require("uuid");

exports.createOrder = async (req, res, next) => {
  const cart = await cartModel
    .findOne({ user: req.userId })
    .populate("items.product");

  const products = cart?.items?.map((i) => {
    return {
      quantity: i?.quantity,
      product: { ...i?.product?._doc },
    };
  });

  const { country, post_code, town, street, cartTotalAmount } = req.body;

  const unique_id = uuid();
  const orderId = unique_id.slice(0, 6);

  console.log("orderId ", orderId);

  const newOrder = new Order({
    userId: req.userId,
    products: products,
    amount: cartTotalAmount,
    address: {
      country,
      post_code,
      street,
      town,
    },
    orderId: orderId,
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
    const orders = await Order.find({ userId: req.userId });

    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json(err);
  }
};
