const express = require("express");
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

app.get("/", (req, res, next) => res.json({ anc: "abc" }));

const cron = require("node-cron");
const { fetchMsgs } = require("./controllers/gmailBotController");
const { jobLaunchSale } = require("./controllers/saleController");

const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const categoryRoute = require("./routes/categoryRoute");
const subCategoryRoute = require("./routes/subCategoryRoute");
const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");
const adminRoute = require("./routes/adminRoute");
const promotionRoute = require('./routes/promotionRoute');
const quantityRoute = require('./routes/quantityRoute');
const reviewRoute = require('./routes/reviewRoute');
const faqRoute = require('./routes/faqRoute');
const shippingRoute = require('./routes/shippingRoute');

app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/category", categoryRoute);
app.use("/api/subCategory", subCategoryRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/admin", adminRoute);
app.use("/api/promotion", promotionRoute);
app.use("/api/quantity", quantityRoute);
app.use("/api/review", reviewRoute);
app.use("/api/faq", faqRoute);
app.use("/api/shipping", shippingRoute);

app.all('*', async (req, res) => {
  res.status(404).json({ error: { message: "Not Found. Kindly Check the API path as well as request type" } })
});

cron.schedule("0 * * * *", async () => {
  try {
    console.log("1 hr ....");
    await fetchMsgs()

  } catch (error) {
    console.log(error)
  }
})

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("daily ....");
    await jobLaunchSale();

  } catch (error) {
    console.log(error)
  }
})

// setInterval(() => {
//   console.log("5 sec....");
//   fetchMsgs();
// // }, 5 * 60 * 1000);
// }, 30000);

app.use(errorMiddleware);

module.exports = app;
