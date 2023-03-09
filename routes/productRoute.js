const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const {auth} = require("../middlewares/auth");
const router = express.Router();

router.post("/create", createProduct);
router.get("/all", getAllProducts);
router.route("/:id").delete(deleteProduct).put(updateProduct).get(getProduct);

module.exports = router;
