const express = require("express");
const {
  addAddr,
  getAddr,
  updateAddr,
  deleteAddr,
  getAllAddr,
  getShippingCharge
} = require("../controllers/addressController");
const {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  getMyCoupon,
} = require("../controllers/userController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/user-profile", auth, getProfile);
router.put("/update-profile", auth, updateProfile);
router.put("/reset-password", auth, updatePassword);

router.get("/calc-shipping", auth, getShippingCharge);

router.post("/address/new", auth, addAddr);
router.get("/address/all", auth, getAllAddr);
router
  .route("/address/:id")
  .get(auth, getAddr)
  .put(auth, updateAddr)
  .delete(auth, deleteAddr);

router.get("/coupons", auth, getMyCoupon);

module.exports = router;
