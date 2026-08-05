require("dotenv").config();
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const createTokenAndSetCookie = (res, user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign(payload, secret, {
    expiresIn: "15m",
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  return token;
};

module.exports = { createTokenAndSetCookie };
