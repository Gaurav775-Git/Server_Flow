require("dotenv").config();
const { query } = require("../config/db");
const cookie = require("cookie");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { registerSchema } = require("../schema/registerSchema");
const { success } = require("zod");
const { config } = require("dotenv");

const register = async (req, res) => {
  try {
    const validateData = registerSchema.safeParse(req.body);
    if (!validateData.success) {
      const zodError = validateData.error.issues.map(
        (issues) => issues.message,
      );
      return res.status(400).json({
        success: false,
        message: "bad request",
      });
    }
    const { name, email, password } = validateData.data;

    const existingUser = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "user already exist",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await query(
      "INSERT INTO users(name , email , password_hash) VALUES($1,$2,$3) RETURNING id,name,email",
      [name, email, hashedPassword],
    );
    console.log(result.rows[0]);
    const { id, role } = result.rows[0];
    const secret = process.env.JWT_SECRET;
    const payload = {
      id,
      email,
      role,
    };
    let token = jwt.sign(payload, secret, {
      expiresIn: "15m",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.status(201).json({
      success: true,
      message: "user registered",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = {
  register,
};
