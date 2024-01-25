const fs = require('fs');
const path = require('path');
const axios = require('axios');
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

const { tokenModel, messageModel } = require("../models/messages");
const orderModel = require('../models/orderModel');
const { subProdModel } = require('../models/productModel');
const userModel = require('../models/userModel');
const { sendEmail } = require('../utils/sendEmail.js');

const generateToken = async () => {
  const message = `
    <div style="max-width: 600px; padding: 1rem;">
      <h1 style="font-weight: 600;">
        The refresh token has been expired. Please set a new refresh token as soon as possible.
      </h1>
    </div>`;

  console.log("INSIDE GENERATE ACCESS TOKEN");
  const refresh_token = await tokenModel.findOne();
  // console.log({ refresh_token });
  try {
    const { data } = await axios.post(
      "https://accounts.google.com/o/oauth2/token",
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        // refresh_token: process.env.REFRESH_TOKEN,
        refresh_token: refresh_token.token,
        grant_type: "refresh_token",
      }
    );
    console.log("INSIDE GENERATE TOKEN", { data })
    return data.access_token;

  } catch (error) {
    console.log({ ERROR: "Refresh Token Expired.", errMsg: error.message });
    await sendEmail("Refresh Token Expired", message, process.env.DEVELOPER_EMAIL);
  }
};

const access_token = "ya29.a0AfB_byBM0rrYBsjYCPl_OBWXKYOzFlha005iSEwngUl9B6GKOBchU-w-2ZwR9gM8x2CGi3xOt26WbpF_FbjD1Cssfc59ArfMU8A2RA_1RQkPVhRSOKj8gE8riYHv8cIPZrdUngT3SxJTmuHH4v8wYBJO6AKS6pCjrkEhXAaCgYKAVsSARMSFQHGX2Miix9xk5XqOyYj8NmF8QUbXw0173";

const url = "https://gmail.googleapis.com/gmail/v1/users/bostongeorgetransfer@gmail.com/messages?q=from:notify@payments.interac.ca&maxResults=10";
// const url = "https://gmail.googleapis.com/gmail/v1/users/umesh.quantumitinnovation@gmail.com/messages?q=from:jnu.unknown@gmail.com&maxResults=10";
// const url = "https://gmail.googleapis.com/gmail/v1/users/bostongeorgetransfer@gmail.com/messages?q=from:sanidhya.quantumitinnovation@gmail.com&maxResults=10"


const checkOrderAndUpdate = async (orderId, amount) => {
  const order = await orderModel.findOne({ orderId });
  if (!order) {
    console.log("Order Not Found");
    return;
  }

  let product_list = "";

  for (var i in order.products) {
    // console.log({ p: order.products[i] })
    const { product, quantity, parent_prod, updatedAmount } = order.products[i];

    if (amount >= order.amount) {
      const prod = await subProdModel.findById(product._id);
      prod.volume = product.volume - quantity;
      prod.stock = (product.volume - quantity) > 0;
      await prod.save();
    }

    product_list += `<tr>
      <td>${parseInt(i) + 1}</td>
      <td>${parent_prod?.name}</td>
      <td>${product?.qname}</td>
      <td>${quantity}</td>
      <td>${updatedAmount}</td>
      <td>${quantity * updatedAmount}</td>
    </tr>`;
  }

  const points = Math.floor(order.amount / 20);
  await userModel.findByIdAndUpdate(order.userId, { $inc: { points: points } });
  if (amount >= order.amount) {
    order.status = 'paid';
    await order.save();
  }

  const orderDetails = {
    product_list,
    shipping: `${order.free_ship ? 0 : order.shipping_charge}`,
    ttl_amount: `${order.amount + order.points_used + order.coupon_amount}`,
    amount_payable: `${order.amount}`,
    remaining: `${order.amount - amount}`,
    amount: `${amount}`,
    coupon_amount: `${order.coupon_amount}`,
    points: `${order.points_used}`,
    status: order.status,
    orderId,
    ...order.address,
    unit: order.address?.unit || ' ',
    dashbaord_link: `something_something/:${order.userId}`,
    order_Percentage: order.status == "paid" ? "Completely Paid" : "Partially Remaining"

  }
  const order_Percentage = order.status === "paid" ? "Complete" : "Partial"

  const template = fs.readFileSync(path.join(__dirname + `/${order_Percentage}.html`), "utf-8")
  // /{{(\w+)}}/g - match {{Word}} globally
  const renderedTemplate = template.replace(/{{(\w+)}}/g, (match, key) => {
    console.log({ match, key })
    return orderDetails[key] || match;
  });

  await sendEmail(`Payment for Order - ${order_Percentage}`, renderedTemplate, process.env.CLIENT_EMAIL);
  console.log({ renderedTemplate });
};

const parseMsg = (result) => {
  console.log({ result })
  // console.log(result.split("#")[1]?.substr(0, 8))
  // console.log({amount: result.split("$")})
  // console.log(result.split("$")[1]?.split("("))
  // console.log(result.split("$")[1]?.split("(")[0].trim())
  return ["#" + result.split("#")[1]?.substr(0, 6).trim(), result.split("$")[1]?.split("(")[0].trim()]
};

const fetchMsg = async (t, access_token) => {
  let snippet;
  try {
    const { data } = await axios.get(
      // `https://gmail.googleapis.com/gmail/v1/users/umesh.quantumitinnovation@gmail.com/messages/${t.toString()}?format=full`,
      `https://gmail.googleapis.com/gmail/v1/users/bostongeorgetransfer@gmail.com/messages/${t.toString()}?format=full`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    // UMESH CODE
    const { body, parts } = data.payload;
    console.log("FETCH FULL MESSAGE", { data, body, parts });
    // const decodedBody = Buffer.from(parts[0]?.body?.data, "base64");
    // snippet += decodedBody.toString("ascii");
    // console.log({ part0: parts[0], snippet });

    // return snippet;

    // ORIGINAL
    snippet = data?.payload?.parts[0]?.parts[0].parts[0].body.data;
    // console.log(snippet)
    // console.log(data.payload.parts[0].parts[0].parts[1])
    const decodedBody = Buffer.from(snippet, "base64");
    const textBody = decodedBody.toString("ascii");
    // console.log(textBody)

    return textBody;
  }
  catch (err) {
    console.log("FETCH MSG", err.message);
  }
};

exports.updateRefreshToken = catchAsyncError(async (req, res, next) => {
  const { new_token } = req.body;
  if (!new_token) return next(new ErrorHandler("Please provide the new refresh_token.", 400));

  let token = await tokenModel.findOne();
  if (!token) {
    token = await tokenModel.create({ token: new_token });
  } else {
    token.token = new_token;
    await token.save();
  }

  res.status(200).json({ success: true });
});

exports.fetchMsgs = async () => {
  try {
    const access_token = await generateToken();
    console.log({ access_token });

    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
    });
    console.log("FETCH ALL MESSAGES", { data })

    data.messages.filter(async ({ id, threadId }) => {
      console.log({ id, threadId });
      const thread = await messageModel.findOne({ msgId: threadId });

      if (!thread) {
        // if (threadId === '189bc14834ae8bc2') {
        const result = await fetchMsg(threadId, access_token);
        const [orderId, amount] = parseMsg(result);
        console.log({ orderId, amount });

        await checkOrderAndUpdate(orderId, amount);

        const newMessages = new messageModel({ msgId: threadId });
        await newMessages.save();
      }
    });
  } catch (err) {
    console.log("err ", err.message);
  }
};