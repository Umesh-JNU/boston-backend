const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Please select a product."]
    },
    promo_image: {
        type: String,
        required: [true, "Please select a image for promotion."]
    },
    updated_price: {
        type: Number,
        required: [true, "Please mention the updated price."]
    }
}, {timestamps: true});

module.exports = mongoose.model("Promotion", promotionSchema);