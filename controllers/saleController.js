const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { productModel, categoryModel, subProdModel } = require("../models/productModel");
const saleModel = require("../models/saleModel");
const APIFeatures = require("../utils/apiFeatures");

exports.createSale = catchAsyncError(async (req, res, next) => {
    const { type, discount, id, start_date, end_date } = req.body;
    let products, sale;
    if (type === "*") {
        await saleModel.deleteMany({});
        products = await productModel.updateMany({}, { $set: { sale: discount } });
        sale = await saleModel.create({ type, discount, start_date, end_date });
    }
    else if (type === "product") {
        if (!id) return next(new ErrorHandler("Please provide the product id", 400));

        await saleModel.deleteOne({ type: "*" });

        const product = await productModel.findById(id);
        if (!product) return next(new ErrorHandler("Product not found.", 404));

        const sale_ = await saleModel.find({ category: product.category });
        if (sale_ && sale_.length > 0) await saleModel.deleteMany({ category: product.category });

        await saleModel.deleteOne({ product: id });

        product.sale = discount;
        await product.save();

        sale = await saleModel.create({ type, discount, product: id, start_date, end_date });

        products = [product]
    }
    else if (type === "category") {
        if (!id) return next(new ErrorHandler("Please provide the category id", 400));

        await saleModel.deleteOne({ type: "*" });


        const category = await categoryModel.findById(id);
        if (!category) return next(new ErrorHandler("Category not found.", 404));
        products = await productModel.updateMany({ category: id }, { $set: { sale: discount } });
        sale = await saleModel.create({ type, discount, category: id, start_date, end_date });
    }
    else return next(new ErrorHandler("Invalid sale type", 400));

    res.status(200).json({ products, sale });
})

exports.getAllSale = catchAsyncError(async (req, res, next) => {
    const saleCount = await saleModel.countDocuments();
    console.log("saleCount", saleCount);
    const apiFeature = new APIFeatures(
        saleModel.find().sort({ createdAt: -1 }).populate("category product"),
        req.query
    ).search("discount");

    let sales = await apiFeature.query;
    console.log("sales", sales);
    let filteredSaleCount = sales.length;
    if (req.query.resultPerPage && req.query.currentPage) {
        apiFeature.pagination();

        console.log("filteredSaleCount", filteredSaleCount);
        sales = await apiFeature.query.clone();
        console.log("sales1", sales);
    }

    res.status(200).json({ sales, saleCount, filteredSaleCount });
})

exports.getSale = catchAsyncError(async (req, res, next) => {
    const sale = await saleModel.findById(req.params.id).populate("category product")

    if (!sale) return next(new ErrorHandler("Sale not found", 404));

    res.status(200).json({ sale });
})

exports.toProduct = catchAsyncError(async (req, res, next) => {

})

exports.removeSale = catchAsyncError(async (req, res, next) => {

})
