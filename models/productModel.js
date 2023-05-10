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
    product_images: [{ type: String }],
    stock: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    sale: { type: Number, default: 0 },
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
    subProduct: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubProduct",
    }]
  },
  { timestamps: true }
);
const productModel = mongoose.model("Product", productSchema);

const subProductSchema = new mongoose.Schema(
  {
    pid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Please provide Product reference id"],
    },
    amount: {
      type: Number,
      required: [true, "Please enter the amount of product."],
    },
    qname: {
      type: String,
      required: [true, "Please provide a quantity type name"],
    },
  },
  { timestamps: true }
);
const subProdModel = mongoose.model("SubProduct", subProductSchema);

const aggregate = async (match) => {
  console.log(match);
  return await productModel.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      }
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "subcategories",
        localField: "sub_category",
        foreignField: "_id",
        as: "sub_category",
      }
    },
    { $unwind: "$sub_category" },
    {
      $lookup: {
        from: "subproducts",
        localField: "subProduct",
        foreignField: "_id",
        as: "subProducts",
      },
    },
    { $unwind: "$subProducts" },
    {
      $addFields: {
        "subProducts.updatedAmount": {
          $subtract: ["$subProducts.amount", { $multiply: [0.01, "$subProducts.amount", "$sale",] }],
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        product_images: { $first: "$product_images" },
        stock: { $first: "$stock" },
        rating: { $first: "$rating" },
        sale: { $first: "$sale" },
        category: { $first: "$category" },
        sub_category: { $first: "$sub_category" },
        subProducts: { $push: "$subProducts" },
        createdAt: {$first: "$createdAt"},
        updatedAt: {$first: "$updatedAt"}
      },
    },
  ]);
}
module.exports = {
  aggregate,
  categoryModel,
  subCategoryModel,
  productModel,
  subProdModel,
};
