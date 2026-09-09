const { query } = require("../config/db");

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id; 
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }

    const result = await query(
      `INSERT INTO projects (name, description, user_id, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, description, status, created_at, updated_at`,
      [name, description || null, userId, 'active']
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Create project error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, name, description, status, created_at, updated_at 
       FROM projects 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Get projects error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT id, name, description, status, created_at, updated_at 
       FROM projects 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Get project error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const userId = req.user.id;

    // Check if project exists
    const checkResult = await query(
      `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    let updateQuery = "UPDATE projects SET ";
    const values = [];
    let counter = 1;

    if (name) {
      updateQuery += `name = $${counter}, `;
      values.push(name);
      counter++;
    }
    if (description !== undefined) {
      updateQuery += `description = $${counter}, `;
      values.push(description);
      counter++;
    }
    if (status) {
      updateQuery += `status = $${counter}, `;
      values.push(status);
      counter++;
    }

    updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${counter} RETURNING id, name, description, status, created_at, updated_at`;
    values.push(id);

    const result = await query(updateQuery, values);

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Update project error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (err) {
    console.error("Delete project error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
};