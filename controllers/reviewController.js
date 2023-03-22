const catchAsyncError = require("../utils/catchAsyncError");
const reviewModel = require("../models/reviewModel");
const userModel = require("../models/userModel");
const {productModel} = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");

exports.addReview = catchAsyncError(async (req, res, next) => {
  console.log("add review", req.body, req.userId);
  const userId = req.userId;
  const { product, comment, rating } = req.body;

  if (rating <= 0)
    return next(
      new ErrorHandler("Rating value should be more than zero.", 401)
    );

  const prod = await productModel.findById(product);
  if (!prod) return next(new ErrorHandler("Product not found", 404));

  const user = await userModel.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const review = await reviewModel.create({
    rating,
    product,
    comment,
    user,
  });

  console.log("review", review);

  res.status(201).json({ review });
});

exports.getAllReview = catchAsyncError(async (req, res, next) => {
  const { product } = req.params;

  const reviews = await reviewModel.find({ product }).populate('user');

  res.status(200).json({ reviews });
});

exports.getReview = catchAsyncError(async (req, res, next) => {
  const { product } = req.params;
  console.log("product", product);
  const userId = req.userId;
  console.log("user", userId);

  const user = await userModel.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const review = await reviewModel.findOne({
    product,
    user: userId,
  });
  console.log("review", review);

  if (!review) return next(new ErrorHandler("Review not found.", 404));

  res.status(200).json({ review });
});
