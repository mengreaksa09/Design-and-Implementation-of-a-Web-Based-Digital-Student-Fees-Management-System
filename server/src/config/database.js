require('dotenv').config();
const path = require('path');

// Use SQLite for easy development (no MySQL setup required)
const useSQLite = process.env.USE_SQLITE === 'true';

module.exports = {
  development: useSQLite
    ? {
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../database.sqlite'),
        logging: console.log,
      }
    : {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'student_fees_db',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log,
      },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
