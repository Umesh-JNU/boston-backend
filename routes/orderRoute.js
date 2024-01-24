const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createOrder,
  getAll,
  getOrder,
  getRecent,
  updateOrderStatus
} = require("../controllers/orderController");

const router = express.Router();

router.post("/add", auth, createOrder);

router.put("/cancel-order/:id", auth, updateOrderStatus);

router.get("/get-order", auth, getOrder);

router.get("/recent-order", auth, getRecent);

router.get("/all", auth, getAll);

module.exports = router;
