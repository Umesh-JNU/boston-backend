const express = require("express");
var ipgeoblock = require("node-ipgeoblock");
var geoip = require("geoip-country");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();

dotenv.config({ path: "./config/config.env" });

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);

// var ip = "207.97.227.239";
// var geo = geoip.lookup();
// console.log("geo ", geo);
// console.log("The IP is %s", geoip.pretty(ip));

// app.use(
//   ipgeoblock({
//     geolite2: "./GeoLite2-Country.mmdb",
//     allowedCountries: ["FR", "GB", "DE", "IN"],
//   })
// );


app.get("/", (req, res, next) => res.json({ anc: "abc" }));

const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const categoryRoute = require("./routes/categoryRoute");
const subCategoryRoute = require("./routes/subCategoryRoute");
const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");
const adminRoute = require("./routes/adminRoute");
const promotionRoute = require('./routes/promotionRoute');

app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/category", categoryRoute);
app.use("/api/subCategory", subCategoryRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/admin", adminRoute);
app.use("/api/promotion", promotionRoute);
app.use(errorMiddleware);

module.exports = app;
