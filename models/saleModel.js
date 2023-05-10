const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ["*", "product", "category"],
		},
		start_date: { type: Date, required: [true, "Start date is required."] },
		end_date: { type: Date, required: [true, "End date is required."] },
		discount: {
			type: Number,
			required: [true, "Discount is required"]
		},
		category: { type: mongoose.Schema.Types.ObjectId,ref: "Category" },
		product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);