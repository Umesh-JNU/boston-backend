const express = require("express");
const {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getSubCategory,
  getAllProducts,
  getAllSubCategory,
} = require("../controllers/categoryController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/create", createCategory);
router.get("/all", getAllCategories);
router.get("/all/subCategories", getAllSubCategory);
router.get("/:id/subCategories", getSubCategory);
router.get("/:id/products", getAllProducts);
router
  .route("/:id")
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
