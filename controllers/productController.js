const express = require("express");
const {
  productModel,
  categoryModel,
  subProdModel,
} = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const { v4: uuid } = require("uuid");
const ErrorHandler = require("../utils/errorHandler");

exports.createProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const { variant } = req.body;

  const product = await (
    await (await productModel.create(req.body)).populate("category")
  ).populate("sub_category");

  for (let v in variant) {
    const _v = await subProdModel.create({ ...variant[v], pid: product._id });
    product.subProduct.push(_v._id);
  }

  await (await product.save()).populate("subProduct");
  res.status(200).json({ product });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  console.log("req.query", req.query);
  const productCount = await productModel.countDocuments();
  console.log("productCount", productCount);
  const apiFeature = new APIFeatures(
    productModel
      .find()
      .populate("category")
      .populate("sub_category")
      .populate("subProduct")
      .sort({ createdAt: -1 }),
    req.query
  ).search("name");

  let products = await apiFeature.query;
  console.log("products", products);
  let filteredProductCount = products.length;

  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredProductCount", filteredProductCount);
    products = await apiFeature.query.clone();
  }

  console.log("prod", products);
  res.status(200).json({ products, productCount, filteredProductCount });
});

exports.getProduct = catchAsyncError(async (req, res, next) => {
  const product = await productModel
    .findById(req.params.id)
    .populate("category")
    .populate("sub_category")
    .populate("subProduct");

  if (!product) return next(new ErrorHandler("Product not found", 404));

  res.status(200).json({ product });
});

exports.getRecentProducts = catchAsyncError(async (req, res, next) => {
  const products = await productModel
    .findById(req.params.id)
    .populate("category");
  // .populate("sub_category");

  console.log(req.params.id);

  console.log("prods ", products.category?._id.toString());

  const recentProducts = await productModel
    .find({ category: products.category?._id.toString() })
    .populate("sub_category");

  res.status(200).json({ recentProducts });
});

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const { variant } = req.body;
  const { id } = req.params;

  const product = await productModel.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  // for (let v in variant) {
  //   if(variant[v]._id)
  //   const _v = await subProdModel.create({ ...variant[v], pid: product._id });
  //   product.subProduct.push(_v._id);
  // }

  await (await product.save()).populate("subProduct");
  res.status(200).json({ product });

  res.status(200).json({ product });
});

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  let product = await productModel.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  await reviewModel.deleteMany({ product: product._id });
  await subProdModel.deleteMany({ pid: product._id });
  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Deleted successfully.",
  });
});
