const express = require("express");
const {
  getAllPromotion,
  getPromotion,
} = require("../controllers/promotionController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.get("/all", getAllPromotion);
router.get("/:id", getPromotion);

module.exports = router;
