const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");

const { verifyToken } = require("../middlewares/authMiddleware");
const { success } = require("zod");

router.post("/register", register);
router.post("/login", login);
router.get("/verify", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "token in recieved",
    user: req.user,
  });
});

module.exports = router;
