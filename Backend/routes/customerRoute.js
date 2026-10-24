const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
router.use(authMiddleware, isAdmin);
const {
  createCustomer,
  getAllCustomers,
} = require("../controller/customerCtrl");

router.post("/", createCustomer);
router.get("/", getAllCustomers);

module.exports = router;
