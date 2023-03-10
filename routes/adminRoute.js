const express = require("express");
const {
  createCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");
const {
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const {
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require("../controllers/promotionController");
const {
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoryController");
const {
  adminLogin,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { auth, isAdmin } = require("../middlewares/auth");
const { s3Uploadv2, upload } = require("../utils/s3");
const router = express.Router();

router.post("/login", adminLogin);
router.get("/user/all", auth, isAdmin, getAllUsers);
router
  .route("/user/:id")
  .put(auth, isAdmin, updateUser)
  .get(auth, isAdmin, getUser)
  .delete(auth, isAdmin, deleteUser);

router.post("/category/create", auth, isAdmin, createCategory);
router
  .route("/category/:id")
  .put(auth, isAdmin, updateCategory)
  .delete(auth, isAdmin, deleteCategory);

router.post("/subCategory/create", auth, isAdmin, createSubCategory);
router
  .route("/subCategory/:id")
  .put(auth, isAdmin, updateSubCategory)
  .delete(auth, isAdmin, deleteSubCategory);

router.post("/product/create", auth, isAdmin, createProduct);
router
  .route("/product/:id")
  .put(auth, isAdmin, updateProduct)
  .delete(auth, isAdmin, deleteProduct);

router.post("/promotion/create", auth, isAdmin, createPromotion);
router
  .route("/promotion/:id")
  .put(auth, isAdmin, updatePromotion)
  .delete(auth, isAdmin, deletePromotion);

router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (req.file) {
      const results = await s3Uploadv2(req.file);
      const location = results.Location && results.Location;
      return res.status(201).json({
        data: {
          location,
        },
      });
    } else {
      return res.status(401).send({ error: { message: "Invalid Image" } });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: { message: "Server Error" } });
  }
});

module.exports = router;
