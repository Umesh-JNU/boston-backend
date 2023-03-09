const catchAsyncError = require("../utils/catchAsyncError");
const addrModel = require("../models/addressModel");
const ErrorHandler = require("../utils/errorHandler");

exports.addAddr = catchAsyncError(async (req, res, next) => {
  console.log("add address", req.body, req.userId);
  const userId = req.userId;
  const { country, town, street, post_code, defaultAddress } = req.body;

  if (defaultAddress) {
    await addrModel.updateMany(
      { user: { $eq: userId } },
      {
        $set: { defaultAddress: false },
      }
    );
  }

  const newAddr = {
    country,
    town,
    street,
    post_code,
    defaultAddress,
    user: userId,
  };
  console.log(newAddr);

  const address = await addrModel.create(newAddr);
  console.log("addr", address);

  res.status(201).json({ address, defaultAddress: defaultAddress });
});

exports.getAllAddr = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  const address_book = await addrModel.find({ user: userId });

  res.status(200).json({ address_book });
});

exports.deleteAddr = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;

  const address = await addrModel.findOne({ _id: id, user: userId });
  console.log("addr", address);

  if (!address) return next(new ErrorHandler("Address not found.", 404));

  await address.remove();

  res.status(202).json({ message: "Address Deleted successfully." });
});

exports.updateAddr = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const { country, town, street, post_code, defaultAddress } = req.body;

  const address = await addrModel.findOne({ _id: id, user: userId });
  if (!address) return next(new ErrorHandler("Address not found.", 404));

  if (defaultAddress) {
    console.log("true");
    // const tempaddr = await addrModel.find(
    //   { user: { $eq: userId } },
    //   { defaultAddress: true }
    // );
    await addrModel.updateMany(
      { _id: { $ne: id } },
      {
        $set: { defaultAddress: false },
      }
    );
    // console.log("tempaddr ", tempaddr);
  }

  address.country = country;
  address.street = street;
  address.town = town;
  address.post_code = post_code;
  address.defaultAddress = defaultAddress;

  await address.save();

  console.log("addr", address);

  res.status(203).json({ address });
});

exports.getAddr = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log(req.userId);
  const userId = req.userId;

  console.log("user", userId);
  const address = await addrModel.findOne({ _id: id, user: userId });
  console.log("addr", address);

  if (!address) return next(new ErrorHandler("Address not found.", 404));

  res.status(200).json({ address });
});

/**
 
{
    "country": "india",
    "street": "621",
    "town": "gaya",
    "post_code": "823003"
}

 */
