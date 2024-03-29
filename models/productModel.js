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
      // required: [true, "Please describe the product."],
    },
    product_images: [{ type: String }],
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
    stock: { type: Boolean, default: false },
    volume: { type: Number, default: 0 }
  },
  { timestamps: true }
);
const subProdModel = mongoose.model("SubProduct", subProductSchema);

// const aggregate = async (match) => {
//   console.log({ match });
const aggregate = async (queryOptions, match) => {
  console.log({ queryOptions, match });
  return await subProdModel.aggregate([
    {
      $group: {
        _id: "$pid",
        subProducts: { $push: "$$ROOT" }
      },
    },
    {
      $lookup: {
        from: "products",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$productId"] }, // used to remove redundant populate
              ...match,
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category"
            }
          },
          { $unwind: "$category" },
          {
            $lookup: {
              from: "subcategories",
              localField: "sub_category",
              foreignField: "_id",
              as: "sub_category"
            }
          },
          { $unwind: "$sub_category" }
        ],
        as: "pid"
      }
    },
    { $unwind: "$pid" },
    { $sort: { "pid.createdAt": -1 } },
    {
      $addFields: {
        subProducts: {
          $map: {
            input: "$subProducts",
            as: "subProduct",
            in: {
              $mergeObjects: [
                "$$subProduct", {
                  updatedAmount: {
                    $subtract: ["$$subProduct.amount", { $multiply: [0.01, "$$subProduct.amount", "$pid.sale"] }]
                  }
                }
              ]
            }
          }
        }
      }
    },
    // { $project: { "subProducts.pid": 0 } },
    // { $addFields: { "_id.subProducts": "$subProducts" } },
    // { $project: { subProducts: 0 } },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$pid", { subProducts: "$subProducts" }]
        }
      }
    },
    { $project: { "subProducts.pid": 0 } },

    ...queryOptions
  ]);

}

module.exports = {
  aggregate,
  categoryModel,
  subCategoryModel,
  productModel,
  subProdModel,
};
