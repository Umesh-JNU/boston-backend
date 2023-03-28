const express = require("express");
const { getStatistics } = require("../controllers/adminController");
const {
  createCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");
const { getAllOrders, deleteOrder, getOrderById, updateOrderStatus } = require("../controllers/orderController");
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
const { allReviews, deleteReview } = require("../controllers/reviewController");
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
const { s3Uploadv2, upload, s3UploadMulti } = require("../utils/s3");
const router = express.Router();


router.get("/statistics/:time", getStatistics);
router.post("/login", adminLogin);
router.get("/user/all", auth, isAdmin, getAllUsers);
router
  .route("/user/:id")
  .put(auth, isAdmin, updateUser)
  .get(auth, isAdmin, getUser)
  .delete(auth, isAdmin, deleteUser);

router.get("/orders/all", auth, isAdmin, getAllOrders);
router.put("/order/:id/update/status", auth, isAdmin, updateOrderStatus);
router
  .route("/order/:id")
  .get(auth, isAdmin, getOrderById)
  .delete(auth, isAdmin, deleteOrder);

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

router.get("/review/all", auth, isAdmin, allReviews);
router.delete("/review/:id", auth, isAdmin, deleteReview);

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

router.post("/multi-image", upload.array("image"), async (req, res) => {
  try {
    if (req.files) {
      const results = await s3UploadMulti(req.files);
      console.log(results);
      let location = [];
      results.filter((result) => {
        location.push(result.Location);
      });
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
