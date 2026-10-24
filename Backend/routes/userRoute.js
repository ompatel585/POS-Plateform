const express = require("express");
const {
  getallUser,
  createUser,
  searchUsers
} = require("../controller/userCtrl");




const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
// Everything here is for the admin panel
router.use(authMiddleware, isAdmin);
router.get("/", searchUsers);


// Get all users (for admin panel)
router.get("/all-users", getallUser);

// Create customer (admin)
router.post("/create-customer", createUser);

module.exports = router;