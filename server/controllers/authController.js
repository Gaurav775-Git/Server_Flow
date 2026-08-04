const { query } = require("../config/db");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: "user already exist",
    });
  }

  const result = await query(
    "INSERT INTO users(name , email , password_hash) VALUES($1,$2,$3) RETURNING id,name,email",
    [name, email, password],
  );
  console.log(result.rows[0]);
  res.status(201).json({
    success: true,
    message: "user registered",
    user: result.rows[0],
  });
};
module.exports = {
  register,
};
