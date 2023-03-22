const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: [true, "User is required."],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Product is not provided."],
    },
    rating: {
      type: Number,
      required: [true, "Please rate the product."],
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Please write a comment."],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
