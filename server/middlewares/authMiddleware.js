require("dotenv").config();
const jwt = require("jsonwebtoken");
const { success } = require("zod");
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token is not provided",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "invalid or expired token",
    });
  }
};
module.exports = { verifyToken };
