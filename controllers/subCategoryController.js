const express = require("express");
const { subCategoryModel, productModel } = require("../models/productModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createSubCategory = catchAsyncError(async (req, res, next) => {
  const { name, description, sub_category_image, category } = req.body;
  const subCategory = await (
    await subCategoryModel.create({
      name,
      description,
      sub_category_image,
      category,
    })
  ).populate("category");
  res.status(200).json({ subCategory });
});

exports.getAllSubCategories = catchAsyncError(async (req, res, next) => {
  const subCategoryCount = await subCategoryModel.countDocuments();
  console.log("subCategoryCount", subCategoryCount);
  const apiFeature = new APIFeatures(
    subCategoryModel.find().sort({ createdAt: -1 }).populate("category"),
    req.query
  ).search("name");

  let subCategories = await apiFeature.query;
  console.log("subCategories", subCategories);
  let filteredSubCategoryCount = subCategories.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredSubCategoryCount", filteredSubCategoryCount);
    subCategories = await apiFeature.query.clone();
  }
  console.log("sub", subCategories);
  res
    .status(200)
    .json({ subCategories, subCategoryCount, filteredSubCategoryCount });
});

exports.getSubCategory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const subCategory = await subCategoryModel.findById(id).populate("category");
  if (!subCategory)
    return next(new ErrorHandler("Sub-category not found", 404));
  res.status(200).json({ subCategory });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const products = await productModel
    .find({ sub_category: id })
    .populate("category");

  res.status(200).json({ products });
});

exports.updateSubCategory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const subCategory = await subCategoryModel
    .findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })
    .populate("category");
  res.status(200).json({ subCategory });
});

exports.deleteSubCategory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let subCategory = await subCategoryModel.findById(id);

  if (!subCategory)
    return next(new ErrorHandler("Sub-category not found", 404));

  await subCategory.remove();

  res.status(200).json({
    success: true,
    message: "Sub-category Deleted successfully.",
  });
});
