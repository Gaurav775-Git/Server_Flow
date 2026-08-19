const { pool } = require('../config/database');

class BaseModel {
  static async query(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = BaseModel;
