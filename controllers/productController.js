const mongoose = require("mongoose");
const { productModel, subProdModel, aggregate } = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const saleModel = require("../models/saleModel");
const cartModel = require("../models/cartModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const { variant } = req.body;

  const product = await (
    await (await productModel.create(req.body)).populate("category")
  ).populate("sub_category");

  variant.forEach(v => { v.pid = product._id });
  const subProducts = await subProdModel.create(variant);

  res.status(200).json({ product, subProducts });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  console.log("req.query", req.query);
  const productCount = await productModel.countDocuments();
  console.log("productCount", productCount);

  const { keyword, currentPage, resultPerPage } = req.query;

  let match = {};
  if (keyword) {
    match = { name: { $regex: keyword, $options: "i" } };
  }

  // let products = await aggregate(match);
  // console.log(products.length);
  // console.log({ products });
  // if (currentPage && resultPerPage) {
  //   const r = parseInt(resultPerPage);
  //   const c = parseInt(currentPage);

  //   const skip = r * (c-1);
  //   console.log(skip, skip+r);
  //   products = products.slice(skip, skip + r);
  // }

  const queryOptions = [];
  if (currentPage && resultPerPage) {
    const r = parseInt(resultPerPage);
    const c = parseInt(currentPage);

    const skip = r * (c - 1);
    queryOptions.push({ $skip: skip });
    queryOptions.push({ $limit: r });
  }
  const products = await aggregate(queryOptions, match);

  let filteredProductCount = products.length;
  res.status(200).json({ products, productCount, filteredProductCount });
});

exports.getProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const products = await aggregate([], { _id: mongoose.Types.ObjectId(id) });
  if (products.length === 0) return next(new ErrorHandler("Product not found", 404));

  res.status(200).json({ product: products[0] });
});

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const { variant } = req.body;
  const { id } = req.params;

  const product = await productModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  }).populate("category").populate("sub_category");
  if (!product) return next(new ErrorHandler("Product not found", 404));

  await cartModel.updateMany({}, { $pull: { "items.product": { $in: product.subProduct } } });
  await subProdModel.deleteMany({ pid: product._id });

  product.subProduct = [];
  for (let v in variant) {
    const _v = await subProdModel.create({ ...variant[v], pid: product._id });
    product.subProduct.push(_v._id);
  }

  await (await product.save()).populate("subProduct");
  res.status(200).json({ product });
});

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  let product = await productModel.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  const subProductIds = product.subProduct;
  await cartModel.updateMany({}, { $pull: { "items.product": { $in: subProductIds } } });
  await subProdModel.deleteMany({ pid: product._id });
  await reviewModel.deleteMany({ product: product._id });
  await saleModel.deleteOne({ product: product._id });
  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Deleted successfully.",
  });
});
