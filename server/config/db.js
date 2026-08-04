require("dotenv").config();
const { Pool, Client } = require("pg");

const pool = new Pool({
  connectionString: process.env.Database_Url,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Database connected");
  }
});

const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
