const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");

const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.get("/verify", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "token in recieved",
    user: req.user,
  });
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true, message: "user logged out" });
});

module.exports = router;
