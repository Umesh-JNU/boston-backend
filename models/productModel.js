const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Please provide the category's name."],
    },
    description: {
      type: String,
      required: [true, "Please describe the category."],
    },
    category_image: {
      type: String,
    },
  },
  { timestamps: true }
);
const categoryModel = mongoose.model("Category", categorySchema);

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide the sub-category's name."],
    },
    description: {
      type: String,
      required: [true, "Please describe the sub-category."],
    },
    sub_category_image: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please provide belonging category."],
    },
  },
  { timestamps: true }
);
const subCategoryModel = mongoose.model("SubCategory", subCategorySchema);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide the product's name."],
    },
    description: {
      type: String,
      required: [true, "Please describe the product."],
    },
    amount: {
      type: Number,
      required: [true, "Please enter the amount of product."],
    },
    product_images: [{ type: String }],
    stock: {
      type: Boolean,
      default: true,
    },
    rating: {
      value: {
        type: Number,
        default: 0,
      },
      num: {
        type: Number,
        default: 0,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please provide belonging category."],
    },
    sub_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "Please provide belonging subCategory."],
    },
  },
  { timestamps: true }
);
const productModel = mongoose.model("Product", productSchema);

module.exports = { categoryModel, subCategoryModel, productModel };
