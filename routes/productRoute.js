const express = require("express");
const {
  getAllProducts,
  getProduct,
  getRecentProducts,
} = require("../controllers/productController");
const router = express.Router();

router.get("/all", getAllProducts);
router.get("/:id", getProduct);
router.get("/:id/get-recent", getRecentProducts);

module.exports = router;
