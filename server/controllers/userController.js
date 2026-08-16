const { query } = require("../config/db");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

// Regular expression to validate email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @route   PUT /api/users/me
 * @desc    Update authenticated user's name and/or email
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    // Obtain user ID directly from JWT identity[cite: 1]
    const userId = req.user.id;
    const { name, email } = req.body;

    // Validate that at least one supported field is provided[cite: 1]
    if (name === undefined && email === undefined) {
      return res.status(400).json({ message: "Provide at least one field to update" });
    }

    // Validate name if provided[cite: 1]
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ message: "Name must not exceed 100 characters" });
      }
    }

    // Validate email if provided[cite: 1]
    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }

      // Check if email is already taken by another user[cite: 1]
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1",
        [email.trim().toLowerCase(), userId]
      );
      if (existing.rows.length) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Dynamically build SQL update query fields and values[cite: 1]
    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(name.trim());
    }
    if (email !== undefined) {
      fields.push(`email = $${i++}`);
      values.push(email.trim().toLowerCase());
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i}
       RETURNING id, name, email, role, is_active, updated_at`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const u = result.rows[0];
    return res.status(200).json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.is_active,
      updatedAt: u.updated_at,
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @route   PUT /api/users/me/password
 * @desc    Update authenticated user's password[cite: 1]
 * @access  Private[cite: 1]
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields[cite: 1]
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    // Validate new password length[cite: 1]
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Fetch user password hash from database[cite: 1]
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1 AND is_active = true LIMIT 1",
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare current password with stored bcrypt hash[cite: 1]
    const matches = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password using configured salt rounds[cite: 1]
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database[cite: 1]
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hash, userId]
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error in updatePassword:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { updateProfile, updatePassword };