require("dotenv").config();
const { query } = require("../config/db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  registerValidationSchema,
} = require("../schema/registerValidationSchema");
const { loginValidationSchema } = require("../schema/loginValidationSchema");
const { createTokenAndSetCookie } = require("../utils/jwt");

const register = async (req, res) => {
  try {
    const validatedData = registerValidationSchema.safeParse(req.body);
    if (!validatedData.success) {
      const zodError = validatedData.error.issues.map(
        (issues) => issues.message,
      );
      return res.status(400).json({
        success: false,
        message: "validation invalid",
        errors: zodError,
      });
    }
    const { name, email, password } = validatedData.data;

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
      "INSERT INTO users(name , email , password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role",
      [name, email, hashedPassword],
    );
    const user = result.rows[0];
    const { id, email: userEmail, role } = user;
    createTokenAndSetCookie(res, {
      id,
      email: userEmail,
      role,
    });

    res.status(201).json({
      success: true,
      message: "user registered",
      user: user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const login = async (req, res) => {
  try {
    const validatedData = loginValidationSchema.safeParse(req.body);
    if (!validatedData.success) {
      const zodError = validatedData.error.issues.map(
        (issues) => issues.message,
      );
      return res.status(400).json({
        success: false,
        message: "validation invalid",
        errors: zodError,
      });
    }
    const { email, password } = validatedData.data;

    const user = await query(
      "SELECT id ,email , password_hash,role FROM users WHERE email =$1 ",
      [email],
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "invalid email or password",
      });
    }
    const hashedPassword = user.rows[0].password_hash;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "invalid email or password",
      });
    }
    const { id, email: userEmail, role } = user.rows[0];
    createTokenAndSetCookie(res, {
      id,
      email: userEmail,
      role,
    });

    res.status(200).json({
      success: true,
      message: "user logged in successfully ",
      user: {
        id,
        email,
        role,
      },
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
  login,
};
