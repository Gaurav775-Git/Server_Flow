const path = require('path');
const dotenv = require('dotenv');

// Support running the server from either the project root or the server folder.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const databaseUrl = new URL(process.env.DATABASE_URL);
// Let the explicit SSL object below control certificate verification.
databaseUrl.searchParams.delete('sslmode');

const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
