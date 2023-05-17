const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { productModel, categoryModel, subProdModel } = require("../models/productModel");
const saleModel = require("../models/saleModel");
const APIFeatures = require("../utils/apiFeatures");

exports.createSale = catchAsyncError(async (req, res, next) => {
	const { type, discount, id, start_date, end_date } = req.body;
	let products, saleData = { type, discount, start_date, end_date };
	if (type === "*") {
		await saleModel.deleteMany({});
		products = await productModel.updateMany({}, { $set: { sale: discount } });
	}
	else if (type === "product") {
		if (!id) return next(new ErrorHandler("Please provide the product id", 400));

		const product = await productModel.findById(id);
		if (!product) return next(new ErrorHandler("Product not found.", 404));

		product.sale = discount;
		await product.save();

		saleData['product'] = id;
		products = [product]
	}
	else if (type === "category") {
		if (!id) return next(new ErrorHandler("Please provide the category id", 400));

		const category = await categoryModel.findById(id);
		if (!category) return next(new ErrorHandler("Category not found.", 404));
		
		products = await productModel.updateMany({ category: id }, { $set: { sale: discount } });
		saleData['category'] = id
	}
	else return next(new ErrorHandler("Invalid sale type", 400));

	const sale = await saleModel.create(saleData);
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

exports.updateSale = catchAsyncError(async (req, res, next) => {
	const { id } = req.params;
	const sale = await saleModel.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});
	res.status(200).json({ sale });
});

exports.deleteSale = catchAsyncError(async (req, res, next) => {
	const { id } = req.params;
	const options = { $set: { sale: 0 } };

	let sale = await saleModel.findById(id);

	if (!sale) return next(new ErrorHandler("Sale not found", 404));

	if (sale.type === "*")
		await productModel.updateMany({}, options);
	else if (sale.type === "product")
		await productModel.updateOne({ _id: sale.product }, options);
	else if (sale.type === "category")
		await productModel.updateMany({ category: sale.category }, options);
	else return next(new ErrorHandler("Invalid sale type.", 400));

	await sale.remove();

	res.status(200).json({
		success: true,
		message: "Sale Deleted successfully.",
	});
});
