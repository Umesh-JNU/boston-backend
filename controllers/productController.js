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
  const { id } = req.params;

  const product = await productModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  }).populate("category").populate("sub_category");
  if (!product) return next(new ErrorHandler("Product not found", 404));

  res.status(200).json({ product });
});

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid product id.", 400));
  }

  let product = await productModel.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  const subProducts = await subProdModel.find({ pid: product._id }).select("_id");
  const subProductIds = subProducts.map((prod) => prod._id.toString());

  await cartModel.updateMany(
    { "items.product": { $in: subProductIds } }, { $pull: { "items": { product: { $in: subProductIds } } } });

  await subProdModel.deleteMany({ pid: product._id });
  await reviewModel.deleteMany({ product: product._id });
  await saleModel.deleteOne({ product: product._id });
  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Deleted successfully.",
  });
});

exports.createSubProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const { pid, qname, amount } = req.body;
  const subProduct = await subProdModel.create({ pid, qname, amount });

  res.status(200).json({ subProduct });
});

exports.deleteSubProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid Id.", 400));
  }

  let subProduct = await subProdModel.findById(id);
  if (!subProduct) return next(new ErrorHandler("Variant not found", 404));

  await cartModel.updateMany(
    { "items.product": id }, { $pull: { "items": { product: id } } });

  await subProduct.remove();

  res.status(200).json({
    success: true,
    message: "Variant Deleted successfully.",
  });
});