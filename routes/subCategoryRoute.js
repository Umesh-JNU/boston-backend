const express = require("express");
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAllProducts,
} = require("../controllers/subCategoryController");
const {auth} = require("../middlewares/auth");
const router = express.Router();

router.post("/create", createSubCategory);
router.get("/all", getAllSubCategories);
router.get("/:id/products", getAllProducts);
router
  .route("/:id")
  .get(getSubCategory)
  .put(updateSubCategory)
  .delete(deleteSubCategory);

module.exports = router;
